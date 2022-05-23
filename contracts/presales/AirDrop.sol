// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IERC20.sol";
import "../libraries/SafeERC20.sol";
import "../libraries/Percent.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * AirDrop user addresses a token balance
 * 
 * Withdrawing tokens occurs over 4 phases:
 *  1: withrawals are limited to 25% of tokens purchased
 *  2: withrawals are limited to 50% of tokens purchased
 *  3: withrawals are limited to 75% of tokens purchased
 *  4: withrawals are unlimited
 */
contract AirDrop is Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct User {
        uint256 airdropped;         // total tokens airdropped to the user
        uint256 balance;            // airdropped tokens remaining after withdrawls
    }

    /**
     * Withdraw phase determines `token` withdrawals by users
     *  NoWithdraw:     default on contract creation, withdrawals are prohibited
     *  Withdraw0:      withdraw 0% of airdropped tokens
     *  Withdraw25:     withdraw up to 25% of airdropped tokens
     *  Withdraw50:     withdraw up to 50% of airdropped tokens
     *  Withdraw75:     withdraw up to 75% of airdropped tokens
     *  Withdraw100:    withdraw up to 100% of airdropped tokens
     * 
     * After Withdraw0 is started, subsequent withdraw phases automatically 
     * begin `WITHDRAW_PHASE_DURATION` after the start of the previous withdraw phase
     */
    enum WithdrawPhase {
        NoWithdraw,
        Withdraw0,
        Withdraw25,
        Withdraw50,
        Withdraw75,
        Withdraw100
    }
    
    /// Name of this airdrop contract
    string public name; 
    
    /// Token being airdropped, i.e. HelixToken
    IERC20 public token;

    /// Current withdraw phase, dictates what percentage of tickets may be withdrawn
    WithdrawPhase public withdrawPhase;

    /// Length of withdrawPhase in seconds, 86400 == 1 day
    uint256 public immutable WITHDRAW_PHASE_DURATION; 

    /// Timestamp after which the current withdrawPhase has ended
    uint256 public withdrawPhaseEndTimestamp;

    /// Owners who can airdrop tokens to users
    address[] public owners;

    /// true if address is an owner and false otherwise
    mapping(address => bool) public isOwner;

    /// Relates user addresses to their struct
    mapping(address => User) public users;
    
    /// Relates a withdrawPhase to the percent of airdropped tokens a user may withdraw during that withdrawPhase
    mapping (uint256 => uint256) public withdrawPhasePercent;

    // Emitted when an owner burns amount of tickets
    event Burned(uint256 amount);

    // Emitted when tickets are withdrawn
    event Withdrawn(address indexed user, uint256 amount);

    // Emitted when an existing owner adds a new owner
    event OwnerAdded(address indexed owner, address indexed newOwner);

    // Emitted when the purchase phase is set
    event SetWithdrawPhase(WithdrawPhase withdrawPhase, uint256 startTimestamp, uint256 endTimestamp);

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "AirDrop: zero address");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "AirDrop: not owner");
        _;
    }

    constructor(
        string memory _name, 
        IERC20 _token, 
        uint256 _WITHDRAW_PHASE_DURATION
    ) onlyValidAddress(address(_token)) {
        name = _name;
        token = _token;

        isOwner[msg.sender] = true;
        owners.push(msg.sender);

        WITHDRAW_PHASE_DURATION = _WITHDRAW_PHASE_DURATION;

        withdrawPhasePercent[2] = 25;       // 25%
        withdrawPhasePercent[3] = 50;       // 50%
        withdrawPhasePercent[4] = 75;       // 75%
        withdrawPhasePercent[5] = 100;      // 100%
    }

    /// Called to withdraw _amount of token to caller's address
    function withdraw(uint256 _amount) external whenNotPaused {
        // Want to be in the latest phase
        updateWithdrawPhase();

        _requireValidRemoval(msg.sender, _amount);

        if (!isOwner[msg.sender]) {
            users[msg.sender].balance -= _amount;
        }
        token.safeTransfer(msg.sender, _amount);

        emit Withdrawn(msg.sender, _amount);
    }

    /// Return true if `amount` is removable by address `by`
    function isRemovable(address _by, uint256 _amount) external view returns (bool) {
        _requireValidRemoval(_by, _amount);
        return true;
    }

    /// Called to destroy `amount` of token
    function burn(uint256 _amount) external onlyOwner { 
        _requireValidRemoval(msg.sender, _amount);
        token.burn(address(this), _amount);
        emit Burned(_amount);
    }

    /// Called externally by owner to manually set the _withdrawPhase
    function setWithdrawPhase(WithdrawPhase _withdrawPhase) external onlyOwner {
        _setWithdrawPhase(_withdrawPhase);
    }

    /// Called externally to airdrop multiple _users tokens
    /// each _users[i] receives amounts[i] many tokens for i in range _users.length
    function airdropAdd(address[] calldata _users, uint256[] calldata _amounts) external onlyOwner {
        require(_users.length == _amounts.length, "AirDrop: users and amounts must be same length");
        for (uint256 i = 0; i < _users.length; i++) {
            uint256 amount = _amounts[i];
            require(amount <= tokenBalance(), "AirDrop: amount exceeds tokens available");

            address user = _users[i];
            users[user].airdropped += amount;
            users[user].balance += amount;
        }
    }

    /// Called externally to reduce a _user's airdrop balance by _amount
    function airdropRemove(address _user, uint256 _amount) external onlyOwner {
        if (users[_user].balance < _amount) {
            users[_user].balance = 0;
        } else {
            users[_user].balance -= _amount;
        }
    }

    /// Return maxAmount removable by address _by
    function maxRemovable(address _by) public view returns (uint256 maxAmount) {
        if (isOwner[_by]) {
            // Owner can withdraw up to the token balance if the contract
            // is in the NoWithdraw state (paused)
            if (withdrawPhase == WithdrawPhase.NoWithdraw) {
                maxAmount = tokenBalance();
            }
        } else {
            // Number of tickets already withdrawn
            uint256 withdrawn = users[_by].airdropped - users[_by].balance;

            // Use the next withdrawPhase if update hasn't been called
            uint256 _withdrawPhase = uint(withdrawPhase);
            if (withdrawPhase != WithdrawPhase.Withdraw100 && block.timestamp >= withdrawPhaseEndTimestamp) {
                _withdrawPhase++;
            }

            // Max number of tokens user can withdraw based on current withdrawPhase, 
            // number of tokens airdropped, and number of tokens already withdrawn
            uint256 phaseMax = Percent.getPercentage(users[_by].airdropped, withdrawPhasePercent[_withdrawPhase]);
            uint256 allowed =  phaseMax - withdrawn;

            // Number of tokens remaining in their balance
            uint256 balance = users[_by].balance;
    
            // Max amount will be the minimum between balance remaining and amount allowed
            maxAmount = Math.min(balance, allowed);
        }
    }

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Add a new _owner to the contract, only callable by an existing owner
    function addOwner(address _owner) external onlyOwner onlyValidAddress(_owner) {
        require(!isOwner[_owner], "AirDrop: already owner");
        isOwner[_owner] = true;
        owners.push(_owner);
        emit OwnerAdded(msg.sender, _owner);
    }

    /// Remove an existing _owner from the contract, only callable by an owner
    function removeOwner(address _owner) external onlyOwner onlyValidAddress(_owner) {
        require(isOwner[_owner], "VipPresale: not owner");
        delete isOwner[_owner];

        // array remove by swap
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
            }
        }
    }

    /// Return the address array of registered owners
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
    
    /// Called periodically and, if sufficient time has elapsed, update the withdrawPhase
    function updateWithdrawPhase() public {
        if (block.timestamp >= withdrawPhaseEndTimestamp) {
            if (withdrawPhase == WithdrawPhase.Withdraw0) {
                _setWithdrawPhase(WithdrawPhase.Withdraw25);
            }
            else if (withdrawPhase == WithdrawPhase.Withdraw25) {
                _setWithdrawPhase(WithdrawPhase.Withdraw50);
            }
            else if (withdrawPhase == WithdrawPhase.Withdraw50) {
                _setWithdrawPhase(WithdrawPhase.Withdraw75);
            }
            else if (withdrawPhase == WithdrawPhase.Withdraw75) {
                _setWithdrawPhase(WithdrawPhase.Withdraw100);
            }
        }
    }

    /// Return this contract's token balance
    function tokenBalance() public view returns(uint256 balance) {
        balance = token.balanceOf(address(this));
    }

    // Called privately to set the _withdrawPhase
    function _setWithdrawPhase(WithdrawPhase _withdrawPhase) private {
        withdrawPhase = _withdrawPhase;
        withdrawPhaseEndTimestamp = block.timestamp + WITHDRAW_PHASE_DURATION;
        emit SetWithdrawPhase(_withdrawPhase, block.timestamp, withdrawPhaseEndTimestamp);
    }

    // Require that _amount of tokens are removable by address _by
    function _requireValidRemoval(address _by, uint256 _amount) private view {
        require(_amount > 0, "AirDrop: zero amount");
        require(_amount <= tokenBalance(), "AirDrop: insufficient contract balance");
        require(_amount <= maxRemovable(_by), "AirDrop: exceeds max amount");
    }
} 
