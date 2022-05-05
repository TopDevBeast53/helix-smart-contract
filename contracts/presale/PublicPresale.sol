// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IERC20.sol';
import '../libraries/SafeERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/*
 * Allow users to purchase outputToken using inputToken via the medium of tickets
 * Purchasing tickets with the inputToken is mediated by the INPUT_RATE and
 * withdrawing tickets for the outputToken is mediated by the OUTPUT_RATE
 * 
 * Purchasing occurs over 2 purchase phases:
 *  1: purchases are limited to whitelisted addresses
 *  2: purchases are open to any address
 * 
 * Withdrawals of tokens equivalent in value to purchased tickets occurs immediately
 * upon completion of purchase transaction
 */
contract PublicPresale is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Maximum number of tickets available for purchase at the start of the sale
    uint public TICKET_MAX;

    // Minimum number of tickets that can be purchased at a time
    uint public MINIMUM_TICKET_PURCHASE;

    // Unsold tickets available for purchase
    // ticketsAvailable = TICKET_MAX - (sum(user.purchased) for user in whitelist)
    // where user.purchased is in range [0, user.maxTicket] for user in whitelist
    uint public ticketsAvailable;

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
     * Purchase phase determines ticket purchase eligiblity
     *  0: is the default on contract creation
     *     purchases are prohibited
     *  1: manually set by the owner
     *     purchases are limited to whitelisted addresses
     *  2: begins automatically PURCHASE_PHASE_DURATION after the start of purchase phase 1
     *     purchases are available to any address
     */
    uint public PURCHASE_PHASE_START;           // Phase when purchasing starts
    uint public PURCHASE_PHASE_END;             // Last phase before purchasing ends
    uint public PURCHASE_PHASE_DURATION;        // Length of time for a purchasePhase, 86400 == 1 day
    uint public purchasePhase;                  // Current purchasePhase
    uint public purchasePhaseEndTimestamp;      // Timestamp after which the current purchasePhase has ended

    // Further purchases are prohibited if paused
    // and owner only burn and withdraw functions are enabled
    // only intended to be used to end the sale
    bool public isPaused;
    
    // Owners who can whitelist users
    address[] public owners;

    // true if address is an owner and false otherwise
    mapping(address => bool) public isOwner;

    // true if user can purchase tickets during purchase phase 1 and false otherwise
    mapping(address => bool) public whitelist;

    // Emitted when a user purchases amount of tickets
    event Purchased(address indexed user, uint amount);

    // Emitted when an owner burns amount of tickets
    event Burned(uint amount);

    // Emitted when a user withdraws amount of tickets
    event Withdrawn(address indexed user, uint amount);

    // Emitted when an existing owner adds a new owner
    event OwnerAdded(address indexed owner, address indexed newOwner);

    // Emitted when the owner pauses the sale
    event Paused();

    // Emitted when the owner unpauses the sale
    event Unpaused();

    // Emitted when the purchase phase is set
    event SetPurchasePhase(uint purchasePhase, uint startTimestamp, uint endTimestamp);

    modifier isValidPurchasePhase(uint phase) {
        require(phase <= PURCHASE_PHASE_END, "PublicPresale: invalid purchase phase");
        _;
    }

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "PublicPresale: zero address");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "PublicPresale: not owner");
        _;
    }

    modifier isNotAboveTicketsAvailable(uint256 amount) {
        require(amount <= ticketsAvailable, "PublicPresale: amount above tickets available");
        _;
    }

    constructor(
        address _inputToken,
        address _outputToken, 
        address _treasury,
        uint _INPUT_RATE, 
        uint _OUTPUT_RATE,
        uint _PURCHASE_PHASE_DURATION
    ) 
        isNotZeroAddress(_inputToken)
        isNotZeroAddress(_outputToken)
        isNotZeroAddress(_treasury)
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

        TICKET_MAX = 21000;
        ticketsAvailable = TICKET_MAX;
        MINIMUM_TICKET_PURCHASE = 1;

        PURCHASE_PHASE_START = 1;
        PURCHASE_PHASE_END = 2;
        PURCHASE_PHASE_DURATION = _PURCHASE_PHASE_DURATION;
    }

    // purchase `amount` of tickets
    function purchase(uint amount) external nonReentrant {
        // Want to be in the latest phase
        _updatePurchasePhase();
   
        // Proceed only if the purchase is valid
        _validatePurchase(msg.sender, amount);

        // Update the contract's remaining tickets
        ticketsAvailable -= amount;
   
        // Get the amount of tokens caller can purchase for `amount`
        uint outputTokenAmount = getAmountOut(amount, outputToken);

        // Get the `inputTokenAmount` in `inputToken` to purchase `amount` of tickets
        uint inputTokenAmount = getAmountOut(amount, inputToken); 

        // Pay for the `amount` of tickets
        require(
            inputTokenAmount <= inputToken.balanceOf(msg.sender), 
            "PublicPresale: insufficient balance"
        );
        require(
            inputTokenAmount <= inputToken.allowance(msg.sender, address(this)), 
            "PublicPresale: insufficient allowance"
        );

        // Pay for the tickets by withdrawing inputTokenAmount from caller
        inputToken.safeTransferFrom(msg.sender, treasury, inputTokenAmount);

        // Transfer `amount` of tickets to caller
        outputToken.safeTransfer(msg.sender, outputTokenAmount);

        emit Purchased(msg.sender, amount);
    }

    // validate that `user` is eligible to purchase `amount` of tickets
    function _validatePurchase(address user, uint amount) private view isNotAboveTicketsAvailable(amount) isNotZeroAddress(user) {
        require(purchasePhase >= PURCHASE_PHASE_START, "PublicPresale: sale not started");
        require(!isPaused, "PublicPresale: sale is paused");
        require(amount >= MINIMUM_TICKET_PURCHASE, "PublicPresale: amount below minimum purchase size");
        if (purchasePhase == PURCHASE_PHASE_START) { 
            require(whitelist[user], "PublicPresale: user not whitelisted");
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

        uint tokenAmount = getAmountOut(amount, outputToken);
        outputToken.burn(address(this), tokenAmount);

        emit Burned(amount);
    }

    // used to withdraw `outputToken` equivalent in value to `amount` of tickets to `to`
    // should only be used after purchasePhase 2 ends
    function withdraw(uint amount) external onlyOwner {
        // remove `amount` of tickets 
        _remove(amount);

        // transfer to `to` the `tokenAmount` equivalent in value to `amount` of tickets
        uint tokenAmount = getAmountOut(amount, outputToken);
        outputToken.safeTransfer(msg.sender, tokenAmount);

        emit Withdrawn(msg.sender, amount);
    }

    // used internally to remove `amount` of tickets from circulation and transfer an 
    // amount of `outputToken` equivalent in value to `amount` to `to`
    function _remove(uint amount) private isNotAboveTicketsAvailable(amount) {
        // proceed only if the removal is valid
        // note that only owners can make removals
        require(isPaused, "PublicPresale: sale must be paused");

        // decrease the tickets available by the amount being removed
        ticketsAvailable -= amount;
    }

    // returns true if `amount` is removable by address `by`
    function isRemovable(uint amount) external view onlyOwner returns(bool) {
        return amount <= ticketsAvailable;
    }
 
    // add a new owner to the contract, only callable by an existing owner
    function addOwner(address owner) external isNotZeroAddress(owner) onlyOwner {
        require(!isOwner[owner], "PublicPresale: already owner");
        isOwner[owner] = true;
        owners.push(owner);

        emit OwnerAdded(msg.sender, owner);
    }

    // return the address array of registered owners
    function getOwners() external view returns(address[] memory) {
        return owners;
    }
    
    // used to end the sale manually
    function pause() external onlyOwner {
        isPaused = true;
        emit Paused();
    }
    
    // safety switch if accidentally paused
    function unpause() external onlyOwner {
        isPaused = false;
        emit Unpaused();
    }

    // called periodically and, if sufficient time has elapsed, update the purchasePhase
    function updatePurchasePhase() external {
        _updatePurchasePhase();
    }

    function _updatePurchasePhase() private {
        if (block.timestamp >= purchasePhaseEndTimestamp) {
            if (purchasePhase >= PURCHASE_PHASE_START && purchasePhase < PURCHASE_PHASE_END) {
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
   
    // used externally to grant multiple `_users` permission to purchase tickets during phase 1
    function whitelistAdd(address[] calldata _users) external onlyOwner {
        for (uint i = 0; i < _users.length; i++) {
            address user = _users[i]; 
            whitelist[user] = true;
        }
    }

    // revoke permission for `user` to purchase tickets
    function whitelistRemove(address user) external onlyOwner {
        delete whitelist[user];
    }
} 
