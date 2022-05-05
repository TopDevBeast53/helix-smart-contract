// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IERC20.sol";
import "../libraries/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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
    uint256 public TICKET_MAX;

    // Minimum number of tickets that can be purchased at a time
    uint256 public MINIMUM_TICKET_PURCHASE;

    // Unsold tickets available for purchase
    // ticketsAvailable = TICKET_MAX - (sum(user.purchased) for user in whitelist)
    // where user.purchased is in range [0, user.maxTicket] for user in whitelist
    uint256 public ticketsAvailable;

    // Token exchanged to purchase tickets, i.e. BUSD
    IERC20 public inputToken;

    // Number of tickets a user gets per `inputToken`
    uint256 public INPUT_RATE;

    // Token being sold in presale and redeemable by exchanging tickets, i.e. HELIX
    IERC20 public outputToken;

    // Number of `outputTokens` a user gets per ticket
    uint256 public OUTPUT_RATE;

    // Number of decimals on the `inputToken` used for calculating ticket exchange rates
    uint256 public INPUT_TOKEN_DECIMALS;

    // Number of decimals on the `outputToken` used for calculating ticket exchange rates
    uint256 public OUTPUT_TOKEN_DECIMALS;

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
    uint256 public PURCHASE_PHASE_START;           // Phase when purchasing starts
    uint256 public PURCHASE_PHASE_END;             // Last phase before purchasing ends
    uint256 public PURCHASE_PHASE_DURATION;        // Length of time for a purchasePhase, 86400 == 1 day
    uint256 public purchasePhase;                  // Current purchasePhase
    uint256 public purchasePhaseEndTimestamp;      // Timestamp after which the current purchasePhase has ended

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
    event Purchased(address indexed user, uint256 amount);

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
    event SetPurchasePhase(uint256 purchasePhase, uint256 startTimestamp, uint256 endTimestamp);

    modifier isValidPurchasePhase(uint256 phase) {
        require(phase <= PURCHASE_PHASE_END, "PublicPresale: PHASE EXCEEDS PURCHASE PHASE END");
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0), "PublicPresale: INVALID ADDRESS");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "PublicPresale: CALLER IS NOT OWNER");
        _;
    }

    constructor(
        address _inputToken,
        address _outputToken, 
        address _treasury,
        uint256 _INPUT_RATE, 
        uint256 _OUTPUT_RATE,
        uint256 _PURCHASE_PHASE_DURATION
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

        TICKET_MAX = 21000;
        ticketsAvailable = TICKET_MAX;
        MINIMUM_TICKET_PURCHASE = 1;

        PURCHASE_PHASE_START = 1;
        PURCHASE_PHASE_END = 2;
        PURCHASE_PHASE_DURATION = _PURCHASE_PHASE_DURATION;
    }

    // purchase `amount` of tickets
    function purchase(uint256 amount) external nonReentrant {
        // Want to be in the latest phase
        _updatePurchasePhase();
   
        // Proceed only if the purchase is valid
        _validatePurchase(msg.sender, amount);

        // Update the contract's remaining tickets
        ticketsAvailable -= amount;
        
        // Get the `inputTokenAmount` in `inputToken` to purchase `amount` of tickets
        uint256 inputTokenAmount = getAmountOut(amount, inputToken); 

        // Pay for the `amount` of tickets
        require(
            inputTokenAmount <= inputToken.balanceOf(msg.sender), 
            "PublicPresale: INSUFFICIENT CALLER TOKEN BALANCE"
        );
        require(
            inputTokenAmount <= inputToken.allowance(msg.sender, address(this)), 
            "PublicPresale: INSUFFICIENT ALLOWANCE"
        );

        // Pay for the tickets by withdrawing inputTokenAmount from caller
        inputToken.safeTransferFrom(msg.sender, treasury, inputTokenAmount);
        
        // Get the amount of tokens caller can purchase for `amount`
        uint256 outputTokenAmount = getAmountOut(amount, outputToken);
        
        // Transfer `amount` of tickets to caller
        outputToken.safeTransfer(msg.sender, outputTokenAmount);

        emit Purchased(msg.sender, amount);
    }

    // validate that `user` is eligible to purchase `amount` of tickets
    function _validatePurchase(address user, uint256 amount) private view isValidAddress(user) {
        require(purchasePhase >= PURCHASE_PHASE_START, "PublicPresale: SALE HAS NOT STARTED");
        require(!isPaused, "PublicPresale: SALE IS PAUSED");
        require(amount >= MINIMUM_TICKET_PURCHASE, "PublicPresale: AMOUNT IS LESS THAN MINIMUM TICKET PURCHASE");
        require(amount <= ticketsAvailable, "PublicPresale: TICKETS ARE SOLD OUT");
        if (purchasePhase == PURCHASE_PHASE_START) { 
            require(whitelist[user], "PublicPresale: USER IS NOT WHITELISTED");
        }
    }

    // get `amountOut` of `tokenOut` for `amountIn` of tickets
    function getAmountOut(uint256 amountIn, IERC20 tokenOut) public view returns(uint256 amountOut) {
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
    function burn(uint256 amount) external onlyOwner { 
        // remove `amount` of tickets 
        _remove(amount);

        uint256 tokenAmount = getAmountOut(amount, outputToken);
        outputToken.burn(address(this), tokenAmount);

        emit Burned(amount);
    }

    // used to withdraw `outputToken` equivalent in value to `amount` of tickets to `to`
    // should only be used after purchasePhase 2 ends
    function withdraw(uint256 amount) external onlyOwner {
        // remove `amount` of tickets 
        _remove(amount);

        // transfer to `to` the `tokenAmount` equivalent in value to `amount` of tickets
        uint256 tokenAmount = getAmountOut(amount, outputToken);
        outputToken.safeTransfer(msg.sender, tokenAmount);

        emit Withdrawn(msg.sender, amount);
    }

    // used internally to remove `amount` of tickets from circulation and transfer an 
    // amount of `outputToken` equivalent in value to `amount` to `to`
    function _remove(uint256 amount) private {
        // proceed only if the removal is valid
        // note that only owners can make removals
        require(isPaused, "PublicPresale: SALE IS NOT PAUSED");
        require(amount <= ticketsAvailable, "PublicPresale: INSUFFICIENT TICKETS AVAILABLE TO REMOVE");

        // decrease the tickets available by the amount being removed
        ticketsAvailable -= amount;
    }

    // returns true if `amount` is removable by address `by`
    function isRemovable(uint256 amount) external view onlyOwner returns(bool) {
        return amount <= ticketsAvailable;
    }
 
    // add a new owner to the contract, only callable by an existing owner
    function addOwner(address owner) external isValidAddress(owner) onlyOwner {
        require(!isOwner[owner], "PublicPresale: ALREADY AN OWNER");
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
    function setPurchasePhase(uint256 phase) external onlyOwner isValidPurchasePhase(phase) {
        _setPurchasePhase(phase);
    }

    // used internally to update purchasePhases
    function _setPurchasePhase(uint256 phase) private {
        purchasePhase = phase;
        purchasePhaseEndTimestamp = block.timestamp + PURCHASE_PHASE_DURATION;
        emit SetPurchasePhase(phase, block.timestamp, purchasePhaseEndTimestamp);
    }
   
    // used externally to grant multiple `_users` permission to purchase tickets during phase 1
    function whitelistAdd(address[] calldata _users) external onlyOwner {
        for (uint256 i = 0; i < _users.length; i++) {
            address user = _users[i]; 
            whitelist[user] = true;
        }
    }

    // revoke permission for `user` to purchase tickets
    function whitelistRemove(address user) external onlyOwner {
        delete whitelist[user];
    }
} 
