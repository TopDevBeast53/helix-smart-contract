// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IERC20.sol';
import '../libraries/SafeERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/*
 * Allow whitelisted users to purchase outputToken using inputToken via the medium of tickets
 * Purchasing tickets with the inputToken is mediated by the INPUT_RATE and
 * withdrawing tickets for the outputToken is mediated by the OUTPUT_RATE
 * 
 * Purchasing occurs over 2 purchase phases:
 *  1: purchases are limited by a maxTicket account attribute
 *  2: purchases are unlimited
 * 
 * Further purchases are prohibited after purchase phase 2 ends
 * The withdraw phase begins after the purchase phase ends
 * 
 * Withdrawing occurs over 4 withdraw phases:
 *  1: withrawals are limited to 25% of tickets purchased
 *  2: withrawals are limited to 50% of tickets purchased
 *  3: withrawals are limited to 75% of tickets purchased
 *  4: withrawals are unlimited
 */
contract VipPresale is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Information about whitelisted users tickets
    struct User {
        uint maxTicket;         // sets purchase phase 1 upper limit on ticket purchases
        uint purchased;         // tickets purchased, invariant: purchased <= maxTicket
        uint balance;           // tickets purchased but not withdrawn
    }

    // Maximum number of tickets available for purchase at the start of the sale
    uint public TICKET_MAX;

    // Minimum number of tickets that can be purchased at a time
    uint public MINIMUM_TICKET_PURCHASE;

    // Unsold tickets available for purchase
    // ticketsAvailable = TICKET_MAX - (sum(user.purchased) for user in whitelist)
    // where user.purchased is in range [0, user.maxTicket] for user in whitelist
    uint public ticketsAvailable;

    // Unsold tickets out of the maximum that have been reserved to users
    // Used to prevent promising more tickets to users than are available
    // ticketsReserved = (sum(user.maxTicket) for user in whitelist)
    // and ticketsReserved <= ticketsAvailable <= TICKET_MAX
    uint public ticketsReserved;

    // Token exchanged to purchase tickets, i.e. BUSD
    IERC20 public inputToken;

    // Number of tickets a user gets per `inputToken`
    uint public INPUT_RATE;

    // Token being sold in presale and redeemable by exchanging tickets, i.e. HELIX
    IERC20 public outputToken;

    // Number of `outputTokens` a user gets per ticket
    uint public OUTPUT_RATE;
    
    // Number of decimals on the `inputToken` used for calculating ticket exchange rates
    uint public INPUT_TOKEN_DECIMALS;

    // Number of decimals on the `outputToken` used for calculating ticket exchange rates
    uint public OUTPUT_TOKEN_DECIMALS;

    // Address that receives `inputToken`s sold in exchange for tickets
    address public treasury;

    /*
     * Purchase phase determines ticket purchases using `inputToken` by whitelisted users 
     *  0: is the default on contract creation
     *     purchases are prohibited
     *  1: manually set by the owner
     *     purchases are limited by a user's `maxTicket` 
     *  2: begins automatically PURCHASE_PHASE_DURATION after the start of purchase phase 1
     *     purchases are unlimited
     */
    uint public PURCHASE_PHASE_START;           // Phase when purchasing starts
    uint public PURCHASE_PHASE_END;             // Last phase before purchasing ends
    uint public PURCHASE_PHASE_DURATION;        // Length of time for a purchasePhase
    uint public purchasePhase;                  // Current purchasePhase
    uint public purchasePhaseEndTimestamp;      // Timestamp after which the current purchasePhase has ended
    
    /* 
     * Withdraw phase determines ticket withdrawals for `outputToken` by whitelisted users
     *  0: default on contract creation
     *     sales are prohibited
     *  1: started manually by the owner 
     *     sales are prohibited
     *  2: withdraw up to 25% of purchased tickets
     *  3: withdraw up to 50% of purchased tickets
     *  4: withdraw up to 75% of purchased tickets
     *  5: withdraw up to 100% of purchased tickets
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

    // if true, users cannot purchase or withdraw but owner can remove
    // else if false, users can purchase or withdraw depending on phase
    // but owner cannot withdraw
    bool public isPaused;

    // Owners who can whitelist users
    address[] public owners;

    // true if address is an owner and false otherwise
    mapping(address => bool) public isOwner;

    // true if user can purchase tickets and false otherwise
    mapping(address => bool) public whitelist;

    // relates user addresses to their struct
    mapping(address => User) public users;
    
    // relates a withdrawPhase to the percent of purchased tickets a user may withdraw during that withdrawPhase
    mapping (uint => uint) public withdrawPhasePercent;
    
    event SetPurchasePhase(uint purchasePhase, uint startTimestamp, uint endTimestamp);
    event SetWithdrawPhase(uint withdrawPhase, uint startTimestamp, uint endTimestamp);

    modifier isValidPurchasePhase(uint phase) {
        require(phase <= PURCHASE_PHASE_END, "VipPresale: PHASE EXCEEDS PURCHASE PHASE END");
        _;
    }

    modifier isValidWithdrawPhase(uint phase) {
        require(phase <= WITHDRAW_PHASE_END, "VipPresale: PHASE EXCEEDS WITHDRAW PHASE END");
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0), "VipPresale: INVALID ADDRESS");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "VipPresale: CALLER IS NOT OWNER");
        _;
    }

    constructor(
        address _inputToken,
        address _outputToken, 
        address _treasury,
        uint _INPUT_RATE, 
        uint _OUTPUT_RATE
    ) 
        isValidAddress(_inputToken)
        isValidAddress(_outputToken)
        isValidAddress(_treasury)
    {
        inputToken = IERC20(_inputToken);
        outputToken = IERC20(_outputToken);

        INPUT_RATE = _INPUT_RATE;
        OUTPUT_RATE = _OUTPUT_RATE;

        treasury = _treasury;

        isOwner[msg.sender] = true;
        owners.push(msg.sender);

        INPUT_TOKEN_DECIMALS = 1e18;
        OUTPUT_TOKEN_DECIMALS = 1e18;

        TICKET_MAX = 50000;
        ticketsAvailable = TICKET_MAX;
        MINIMUM_TICKET_PURCHASE = 1;

        PURCHASE_PHASE_START = 1;
        PURCHASE_PHASE_END = 2;
        PURCHASE_PHASE_DURATION = 1 days;

        WITHDRAW_PHASE_START = 1;
        WITHDRAW_PHASE_END = 5;
        WITHDRAW_PHASE_DURATION = 91 days;  // (91 days ~= 3 months) and (91 days * 4 ~= 1 year)

        withdrawPhasePercent[2] = 25;       // 25%
        withdrawPhasePercent[3] = 50;       // 50%
        withdrawPhasePercent[4] = 75;       // 75%
        withdrawPhasePercent[5] = 100;      // 100%
        WITHDRAW_PERCENT = 100;             // the denominator, withdrawPhasePercent[x]/WITHDRAW_PERCENT
    }

    // purchase `amount` of tickets
    function purchase(uint amount) external nonReentrant {
        // want to be in the latest phase
        _updatePurchasePhase();
   
        // proceed only if the purchase is valid
        _validatePurchase(msg.sender, amount);

        // get the `inputTokenAmount` in `inputToken` to purchase `amount` of tickets
        uint tokenAmount = getAmountOut(amount, inputToken); 

        require(
            tokenAmount <= inputToken.balanceOf(msg.sender), 
            "VipPresale: INSUFFICIENT TOKEN BALANCE"
        );
        require(
            tokenAmount <= inputToken.allowance(msg.sender, address(this)),
            "VipPresale: INSUFFICIENT ALLOWANCE"
        );
        inputToken.safeTransferFrom(msg.sender, treasury, tokenAmount);

        users[msg.sender].purchased += amount;
        users[msg.sender].balance += amount;

        ticketsAvailable -= amount;
    }

    // validate that `user` is eligible to purchase `amount` of tickets
    function _validatePurchase(address user, uint amount) private view isValidAddress(user) {
        require(!isPaused, "VipPresale: SALE IS PAUSED");
        require(purchasePhase >= PURCHASE_PHASE_START, "VipPresale: SALE HAS NOT STARTED");
        require(whitelist[user], "VipPresale: USER IS NOT WHITELISTED");
        require(amount >= MINIMUM_TICKET_PURCHASE, "VipPresale: AMOUNT IS LESS THAN MINIMUM TICKET PURCHASE");
        require(amount <= ticketsAvailable, "VipPresale: TICKETS ARE SOLD OUT");
        if (purchasePhase == PURCHASE_PHASE_START) { 
            require(
                users[user].purchased + amount <= users[user].maxTicket, 
                "VipPresale: AMOUNT EXCEEDS MAX TICKET LIMIT"
            );
        } else {
            require(block.timestamp < purchasePhaseEndTimestamp, "VipPresale: SALE HAS ENDED");
        }
    }

    // get `amountOut` of `tokenOut` for `amountIn` of tickets
    function getAmountOut(uint amountIn, IERC20 tokenOut) public view returns(uint amountOut) {
        if (address(tokenOut) == address(inputToken)) {
            amountOut = amountIn * INPUT_RATE * INPUT_TOKEN_DECIMALS;
        } else if (address(tokenOut) == address(outputToken)) {
            amountOut = amountIn * OUTPUT_RATE * OUTPUT_TOKEN_DECIMALS;
        } else {
            amountOut = 0;
        }
    }

    // used to destroy `outputToken` equivalant in value to `amount` of tickets
    // should only be used after purchasePhase 2 ends
    function burn(uint amount) external onlyOwner { 
        // remove `amount` of tickets
        _remove(amount);

        // get the `tokenAmount` equivalent in value to `amount` of tickets
        uint tokenAmount = getAmountOut(amount, outputToken);
        outputToken.burn(address(this), tokenAmount);
    }

    // used to withdraw `outputToken` equivalent in value to `amount` of tickets to `to`
    function withdraw(uint amount) external {
        // want to be in the latest phase
        _updateWithdrawPhase();

        // remove `amount` of tickets
        _remove(amount);

        // get the `tokenAmount` equivalent in value to `amount` of tickets
        uint tokenAmount = getAmountOut(amount, outputToken);
        outputToken.safeTransfer(msg.sender, tokenAmount);
    }

    // used internally to remove `amount` of tickets from circulation
    function _remove(uint amount) private {
        // proceed only if the removal is valid
        _validateRemoval(msg.sender, amount);

        if (isOwner[msg.sender]) {
            // if the caller is an owner, they won't have purchased tickets
            // so we need to decrease the tickets available by the amount being removed
            ticketsAvailable -= amount;
        } else {
            // otherwise, the user will have purchased tickets and the tickets available
            // will already have been updated so we only need to decrease their balance
            users[msg.sender].balance -= amount;
        }
    }

    // validate whether `amount` of tickets are removable by address `by`
    function _validateRemoval(address by, uint amount) private view {
        require(amount <= ticketsAvailable, "VipPresale: INSUFFICIENT CONTRACT BALANCE TO REMOVE");
        require(amount <= maxRemovable(by), "VipPresale: INSUFFICIENT ACCOUNT BALACE TO REMOVE");
    }

    // returns `maxAmount` removable by address `by`
    function maxRemovable(address by) public view returns(uint maxAmount) {
        if (isOwner[by]) {
            // owner can, at any time, remove all of the tokens available
            maxAmount = isPaused ? ticketsAvailable : 0;
        } else {
            if (isPaused) {
                maxAmount = 0;
            } else {
                // Max number of tickets user can withdraw as a function of withdrawPhase and 
                // number of tickets purchased
                uint allowed = users[by].purchased * withdrawPhasePercent[withdrawPhase] / WITHDRAW_PERCENT;

                // Number of tickets remaining in their balance
                uint balance = users[by].balance;
        
                // Can only only withdraw the max allowed if they have a large enough balance
                maxAmount = balance < allowed ? balance : allowed;
            }
        }
    }

    // returns true if `amount` is removable by address `by`
    function isRemovable(address by, uint amount) external view returns(bool) {
        _validateRemoval(by, amount);
        return true;
    }
 
    // add a new owner to the contract, only callable by an existing owner
    function addOwner(address owner) external isValidAddress(owner) onlyOwner {
        require(!isOwner[owner], "VipPresale: ALREADY AN OWNER");
        isOwner[owner] = true;
        owners.push(owner);
    }

    // return the address array of registered owners
    function getOwners() external view returns(address[] memory) {
        return owners;
    }

    // Stop user purchases and withdrawals, enable owner withdrawals
    function pause() external onlyOwner {
        isPaused = true;
    }

    function unpause() external onlyOwner {
        isPaused = false;
    }

    // called periodically and, if sufficient time has elapsed, update the purchasePhase
    function _updatePurchasePhase() private {
        if (purchasePhase >= PURCHASE_PHASE_START) {
            if (purchasePhase < PURCHASE_PHASE_END && block.timestamp >= purchasePhaseEndTimestamp) {
                _setPurchasePhase(purchasePhase + 1);
            }
        }
    }

    // used externally to update from purchasePhase 0 to purchasePhase 1
    // should only ever be called to set purchasePhase == 1
    function setPurchasePhase(uint phase) external onlyOwner isValidPurchasePhase(phase) {
        _setPurchasePhase(phase);
    }

    // used internally to update purchasePhases
    function _setPurchasePhase(uint phase) private {
        purchasePhase = phase;
        purchasePhaseEndTimestamp = block.timestamp + PURCHASE_PHASE_DURATION;
        emit SetPurchasePhase(phase, block.timestamp, purchasePhaseEndTimestamp);
    }

    // called periodically and, if sufficient time has elapsed, update the withdrawPhase
    function _updateWithdrawPhase() private {
        if (withdrawPhase >= WITHDRAW_PHASE_START) {
            if (withdrawPhase < WITHDRAW_PHASE_END && block.timestamp >= withdrawPhaseEndTimestamp) {
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
   
    // used externally to grant multiple `_users` permission to purchase `maxTickets`
    // such that _users[i] can purchase maxTickets[i] many tickets for i in range _users.length
    function whitelistAdd(address[] calldata _users, uint[] calldata maxTickets) external onlyOwner {
        require(_users.length == maxTickets.length, "VipPresale: USERS AND MAX TICKETS MUST HAVE SAME LENGTH");
        for (uint i = 0; i < _users.length; i++) {
            address user = _users[i];
            uint maxTicket = maxTickets[i];
            _whitelistAdd(user, maxTicket);
        }
    }

    // used internally to grant `user` permission to purchase up to `maxTicket`, purchasePhase dependent
    function _whitelistAdd(address user, uint maxTicket) private isValidAddress(user) {
        require(maxTicket <= ticketsAvailable, "VipPresale: MAX TICKET CAN'T BE GREATER THAN TICKETS AVAILABLE");
        require(!whitelist[user], "VipPresale: USER IS ALREADY WHITELISTED");
        whitelist[user] = true;
        users[user].maxTicket = maxTicket;

        require(ticketsReserved + maxTicket <= ticketsAvailable, "VipPresale: INADEQUATE TICKETS FOR ALL USERS");
        ticketsReserved += maxTicket;
    }

    // revoke permission for `user` to purchase tickets
    function whitelistRemove(address user) external onlyOwner {
        // prohibit a whitelisted user from purchasing tickets
        // but not from withdrawing those they've already purchased
        whitelist[user] = false;
    }
} 
