// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IERC20.sol";
import "../libraries/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/*
 * AirDrop user addresses a token balance
 * 
 * Withdrawing tokens occurs over 4 phases:
 *  1: withrawals are limited to 25% of tokens purchased
 *  2: withrawals are limited to 50% of tokens purchased
 *  3: withrawals are limited to 75% of tokens purchased
 *  4: withrawals are unlimited
 */
contract AirDrop is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // the name of this airdrop contract
    string public name; 

    struct User {
        uint256 airdropped;        // total tokens airdropped to the user
        uint256 balance;           // airdropped tokens remaining after withdrawls
    }
    
    // Token being airdropped, i.e. HelixToken
    IERC20 public token;

    /* 
     * Withdraw phase determines `token` withdrawals by users
     *  0: default on contract creation
     *     withdrawals are prohibited
     *  1: started manually by the owner 
     *     withdrawls are prohibited
     *  2: withdraw up to 25% of airdropped tokens
     *  3: withdraw up to 50% of airdropped tokens
     *  4: withdraw up to 75% of airdropped tokens
     *  5: withdraw up to 100% of airdropped tokens
     * 
     * After withdraw phase 1 is started, subsequent withdraw phases automatically 
     * begin `WITHDRAW_PHASE_DURATION` after the start of the previous withdraw phase
     */
    uint256 public constant WITHDRAW_PHASE_START = 1;           // Phase when withdrawing starts 
    uint256 public constant WITHDRAW_PHASE_END = 5;             // Last withdraw phase, does not end withdrawing

    uint256 public immutable WITHDRAW_PHASE_DURATION;        // Length of time for a withdrawPhase, 86400 == 1 day

    uint256 public withdrawPhase;                  // Current withdrawPhase
    uint256 public withdrawPhaseEndTimestamp;      // Timestamp after which the current withdrawPhase has ended

    uint256 public constant WITHDRAW_PERCENT = 100;    // the denominator, withdrawPhasePercent[x]/WITHDRAW_PERCENT

    // sets whether withdrawals are enabled or disabled and by whom
    bool public isPaused;

    // Owners who can airdrop tokens to users
    address[] public owners;

    // true if address is an owner and false otherwise
    mapping(address => bool) public isOwner;

    // relates user addresses to their struct
    mapping(address => User) public users;
    
    // relates a withdrawPhase to the percent of airdropped tokens a user may withdraw during that withdrawPhase
    mapping (uint256 => uint) public withdrawPhasePercent;

   // Emitted when an owner burns amount of tickets
    event Burned(uint256 amount);

    // Emitted when a user withdraws amount of tickets
    event Withdrawn(address indexed user, uint256 amount);

    // Emitted when an existing owner adds a new owner
    event OwnerAdded(address indexed owner, address indexed newOwner);

    // Emitted when the owner pauses the sale
    event Paused();

    // Emitted when the owner unpauses the sale
    event Unpaused(); 

    // Emitted when the purchase phase is set
    event SetWithdrawPhase(uint256 withdrawPhase, uint256 startTimestamp, uint256 endTimestamp);

    modifier isValidWithdrawPhase(uint256 phase) {
        require(phase <= WITHDRAW_PHASE_END, "AirDrop: invalid withdraw phase");
        _;
    }

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "AirDrop: zero address");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "AirDrop: not owner");
        _;
    }

    constructor(string memory _name, address _token, uint256 _WITHDRAW_PHASE_DURATION) isNotZeroAddress(_token) {
        name = _name;
        token = IERC20(_token);

        isOwner[msg.sender] = true;
        owners.push(msg.sender);

        WITHDRAW_PHASE_DURATION = _WITHDRAW_PHASE_DURATION;

        withdrawPhasePercent[2] = 25;       // 25%
        withdrawPhasePercent[3] = 50;       // 50%
        withdrawPhasePercent[4] = 75;       // 75%
        withdrawPhasePercent[5] = 100;      // 100%
    }

    // used to destroy `amount` of token
    function burn(uint256 amount) external onlyOwner { 
        _validateRemoval(msg.sender, amount);
        token.burn(address(this), amount);
        emit Burned(amount);
    }

    // used to withdraw `amount` of token to caller's address
    function withdraw(uint256 amount) external {
        // want to be in the latest phase
        _updateWithdrawPhase();

        _validateRemoval(msg.sender, amount);

        if (!isOwner[msg.sender]) {
            users[msg.sender].balance -= amount;
        }
        token.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    // validate whether `amount` of tokens are removable by address `by`
    function _validateRemoval(address by, uint256 amount) private view {
        require(amount <= tokenBalance(), "AirDrop: insufficient contract balance");
        require(amount <= maxRemovable(by), "AirDrop: unable to remove");
    }

    // returns `maxAmount` removable by address `by`
    function maxRemovable(address by) public view returns(uint256 maxAmount) {
        if (isOwner[by]) {
            // if paused owner can remove all tokens, otherwise they can't remove tokens
            maxAmount = isPaused ? tokenBalance() : 0;
        } else {
            if (isPaused) {
                maxAmount = 0;
            } else {
                // Max number of tokens user can withdraw as a function of withdrawPhase and 
                // number of tokens airdropped
                uint256 allowed = users[by].airdropped * withdrawPhasePercent[withdrawPhase] / WITHDRAW_PERCENT;

                // Number of tokens remaining in their balance
                uint256 balance = users[by].balance;
        
                // Can only withdraw the max allowed if they have a large enough balance
                maxAmount = balance < allowed ? balance : allowed;
            }
        }
    }

    // returns true if `amount` is removable by address `by`
    function isRemovable(address by, uint256 amount) external view returns(bool) {
        _validateRemoval(by, amount);
        return true;
    }
 
    // add a new owner to the contract, only callable by an existing owner
    function addOwner(address owner) external isNotZeroAddress(owner) onlyOwner {
        require(!isOwner[owner], "AirDrop: already owner");
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAdded(msg.sender, owner);
    }

    // return the address array of registered owners
    function getOwners() external view returns(address[] memory) {
        return owners;
    }
    
    // disable user withdrawals manually and enable owner removals
    function pause() external onlyOwner {
        isPaused = true;
        emit Paused();
    }
    
    // disable owner removals and enable user withdrawls (withdrawPhase dependent)
    function unpause() external onlyOwner {
        isPaused = false;
        emit Unpaused();
    }

    // return this contract's token balance
    function tokenBalance() public view returns(uint256 balance) {
        balance = token.balanceOf(address(this));
    }

    // called periodically and, if sufficient time has elapsed, update the withdrawPhase
    function updateWithdrawPhase() external {
        _updateWithdrawPhase();
    }

    function _updateWithdrawPhase() private {
        if (block.timestamp >= withdrawPhaseEndTimestamp) {
            if (withdrawPhase >= WITHDRAW_PHASE_START && withdrawPhase < WITHDRAW_PHASE_END) {
                _setWithdrawPhase(withdrawPhase + 1);
            }
        }
    }

    // used externally to update from withdrawPhase 0 to withdrawPhase 1
    // should only ever be called to set withdrawPhase == 1
    function setWithdrawPhase(uint256 phase) external onlyOwner isValidWithdrawPhase(phase) {
        _setWithdrawPhase(phase);
    }

    // used internally to update withdrawPhases
    function _setWithdrawPhase(uint256 phase) private {
        withdrawPhase = phase;
        withdrawPhaseEndTimestamp = block.timestamp + WITHDRAW_PHASE_DURATION;
        emit SetWithdrawPhase(phase, block.timestamp, withdrawPhaseEndTimestamp);
    }
   
    // used externally to airdrop multiple `_users` tokens
    // each _users[i] receives amounts[i] many tokens for i in range _users.length
    function airdropAdd(address[] calldata _users, uint[] calldata amounts) external onlyOwner {
        require(_users.length == amounts.length, "AirDrop: users and amounts must be same length");
        for (uint256 i = 0; i < _users.length; i++) {
            uint256 amount = amounts[i];
            require(amount <= tokenBalance(), "AirDrop: amount greater than tokens available");

            address user = _users[i];
            users[user].airdropped += amount;
            users[user].balance += amount;
        }
    }

    // used externally to reduce a `user`s airdrop balance by `amount`
    function airdropRemove(address user, uint256 amount) external onlyOwner {
        if (users[user].balance < amount) {
            users[user].balance = 0;
        } else {
            users[user].balance -= amount;
        }
    }
} 
