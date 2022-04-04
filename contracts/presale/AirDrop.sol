// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IERC20.sol';
import '../libraries/SafeERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

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
        uint airdropped;        // total tokens airdropped to the user
        uint balance;           // airdropped tokens remaining after withdrawls
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
    uint public WITHDRAW_PHASE_START;           // Phase when withdrawing starts 
    uint public WITHDRAW_PHASE_END;             // Last withdraw phase, does not end withdrawing
    uint public WITHDRAW_PHASE_DURATION;        // Length of time for a withdrawPhase
    uint public withdrawPhase;                  // Current withdrawPhase
    uint public withdrawPhaseEndTimestamp;      // Timestamp after which the current withdrawPhase has ended

    uint public WITHDRAW_PERCENT;               // Used as the denominator when calculating withdraw percent

    // sets whether withdrawals are enabled or disabled and by whom
    bool public isPaused;

    // Owners who can airdrop tokens to users
    address[] public owners;

    // true if address is an owner and false otherwise
    mapping(address => bool) public isOwner;

    // relates user addresses to their struct
    mapping(address => User) public users;
    
    // relates a withdrawPhase to the percent of airdropped tokens a user may withdraw during that withdrawPhase
    mapping (uint => uint) public withdrawPhasePercent;
    
    event SetWithdrawPhase(uint withdrawPhase, uint startTimestamp, uint endTimestamp);

    modifier isValidWithdrawPhase(uint phase) {
        require(phase <= WITHDRAW_PHASE_END, "AirDrop: PHASE EXCEEDS WITHDRAW PHASE END");
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0), "AirDrop: INVALID ADDRESS");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "AirDrop: CALLER IS NOT OWNER");
        _;
    }

    constructor(string memory _name, address _token) isValidAddress(_token) {
        name = _name;
        token = IERC20(_token);

        isOwner[msg.sender] = true;
        owners.push(msg.sender);

        WITHDRAW_PHASE_START = 1;
        WITHDRAW_PHASE_END = 5;
        WITHDRAW_PHASE_DURATION = 91 days;  // (91 days ~= 3 months) and (91 days * 4 ~= 1 year)

        withdrawPhasePercent[2] = 25;       // 25%
        withdrawPhasePercent[3] = 50;       // 50%
        withdrawPhasePercent[4] = 75;       // 75%
        withdrawPhasePercent[5] = 100;      // 100%
        WITHDRAW_PERCENT = 100;             // the denominator, withdrawPhasePercent[x]/WITHDRAW_PERCENT
    }

    // used to destroy `amount` of token
    function burn(uint amount) external onlyOwner { 
        _validateRemoval(msg.sender, amount);
        token.burn(address(this), amount);
    }

    // used to withdraw `amount` of token to caller's address
    function withdraw(uint amount) external {
        // want to be in the latest phase
        updateWithdrawPhase();

        _validateRemoval(msg.sender, amount);

        if (!isOwner[msg.sender]) {
            users[msg.sender].balance -= amount;
        }
        token.safeTransfer(msg.sender, amount);
    }

    // validate whether `amount` of tokens are removable by address `by`
    function _validateRemoval(address by, uint amount) private view {
        require(amount <= tokenBalance(), "AirDrop: INSUFFICIENT CONTRACT BALANCE TO REMOVE");
        require(amount <= maxRemovable(by), "AirDrop: UNABLE TO REMOVE AMOUNT");
    }

    // returns `maxAmount` removable by address `by`
    function maxRemovable(address by) public view returns(uint maxAmount) {
        if (isOwner[by]) {
            // if paused owner can remove all tokens, otherwise they can't remove tokens
            maxAmount = isPaused ? tokenBalance() : 0;
        } else {
            // user can remove up to their balance
            maxAmount = isPaused ? 0 : users[by].balance;
        }
    }

    // returns true if `amount` is removable by address `by`
    function isRemovable(address by, uint amount) external view returns(bool) {
        _validateRemoval(by, amount);
        return true;
    }
 
    // add a new owner to the contract, only callable by an existing owner
    function addOwner(address owner) external isValidAddress(owner) onlyOwner {
        require(!isOwner[owner], "AirDrop: ALREADY AN OWNER");
        isOwner[owner] = true;
        owners.push(owner);
    }

    // return the address array of registered owners
    function getOwners() external view returns(address[] memory) {
        return owners;
    }
    
    // disable user withdrawals manually and enable owner removals
    function pause() external onlyOwner {
        isPaused = true;
    }
    
    // disable owner removals and enable user withdrawls (withdrawPhase dependent)
    function unpause() external onlyOwner {
        isPaused = false;
    }

    // return this contract's token balance
    function tokenBalance() public view returns(uint balance) {
        balance = token.balanceOf(address(this));
    }

    // called periodically and, if sufficient time has elapsed, update the withdrawPhase
    function updateWithdrawPhase() public {
        if (block.timestamp >= withdrawPhaseEndTimestamp) {
            if (withdrawPhase >= WITHDRAW_PHASE_START && withdrawPhase < WITHDRAW_PHASE_END) {
                _setWithdrawPhase(withdrawPhase + 1);
            }
        }
    }

    // used externally to update from withdrawPhase 0 to withdrawPhase 1
    // should only ever be called to set withdrawPhase == 1
    function setWithdrawPhase(uint phase) external onlyOwner isValidWithdrawPhase(phase) {
        _setWithdrawPhase(phase);
    }

    // used internally to update withdrawPhases
    function _setWithdrawPhase(uint phase) private {
        withdrawPhase = phase;
        withdrawPhaseEndTimestamp = block.timestamp + WITHDRAW_PHASE_DURATION;
        emit SetWithdrawPhase(phase, block.timestamp, withdrawPhaseEndTimestamp);
    }
   
    // used externally to airdrop multiple `_users` tokens
    // each _users[i] receives amounts[i] many tokens for i in range _users.length
    function airdropAdd(address[] calldata _users, uint[] calldata amounts) external onlyOwner {
        require(_users.length == amounts.length, "AirDrop: USERS AND AMOUNTS MUST HAVE SAME LENGTH");
        for (uint i = 0; i < _users.length; i++) {
            uint amount = amounts[i];
            require(amount <= tokenBalance(), "AirDrop: AMOUNT CAN'T BE GREATER THAN TOKENS AVAILABLE");

            address user = _users[i];
            users[user].airdropped += amount;
            users[user].balance += amount;
        }
    }

    // used externally to reduce a `user`s airdrop balance by `amount`
    function airdropRemove(address user, uint amount) external onlyOwner {
        if (users[user].balance < amount) {
            users[user].balance = 0;
        } else {
            users[user].balance -= amount;
        }
    }
} 
