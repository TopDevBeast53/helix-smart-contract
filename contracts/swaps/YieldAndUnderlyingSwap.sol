// SPDX-License-Identifer: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IMasterChef.sol';
import "../interfaces/IERC20.sol";
import '../libraries/SafeERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/*
 * P2P swap for sellers to sell liquidity tokens and their yield after being locked
 * for a duration. Sellers open a swap and set the amount of liquidity tokens to
 * sell, the minimum bid, the starting ask, the duration of bidding on the swap, and 
 * the duration liquidity tokens are locked after bidding has closed. Buyers can accept
 * the ask or make a bid. If no bid or ask has been accepted before bidding ends the 
 * highest bidder is selected. When bidding ends the seller recieves the highest bid 
 * and the liquidity tokens are locked until the lock duration expires, after which 
 * the buyer can withdraw their liquidity tokens plus their earned yield. 
 */
contract YieldAndUnderlyingSwap is ReentrancyGuard {
    using SafeERC20 for IERC20;
        
    // Chef contract used to generate yield on lpToken
    IMasterChef public chef;

    // Token exchanged by buyer to seller for lpToken, i.e. HELIX
    IERC20 public exToken;

    // Maximum duration in seconds that a swap can be locked before allowing withdrawal, 86400 == 1 day
    uint public MAX_LOCK_DURATION;

    struct Swap {
        IERC20 lpToken;             // Liquidity token plus yield being sold
        uint[] bidIds;              // Array of ids referencing bids made on this swap 
        address seller;             // Address that opened this swap and that is selling amount of lpToken
        address buyer;              // Address of the buyer of this swap, set only after the swap is closed
        uint poolId;                // Id relating lpToken to it's appropriate chef pool
        uint amount;                // Amount of lpToken being sold in this swap
        uint ask;                   // Amount of exToken seller is asking for in exchange for amount of lpToken and yield
        uint lockUntilTimestamp;    // Timestamp after which the buyer can withdraw their purchase of lpToken and yield
        uint lockDuration;          // Duration between (buyer accepting ask or seller accepting bid) and lockUntilTimestamp
        bool isOpen;                // True if bids or ask are being accepted and false otherwise
        bool isWithdrawn;           // True if the purchase has been withdrawn by buyer and false otherwise
    }

    struct Bid {
        address bidder;             // Address making this bid
        uint swapId;                // Id of the swap this bid was made on
        uint amount;                // Amount of exToken bidder is offering in exchange for amount of lpToken and yield
    }

    // Current swap id, the number of swaps opened, 
    // and for swapId i where i in range[0, swapId], i indexes a Swap in swaps
    uint public swapId;

    // Current bid id, the number of bids made,
    // and for bidId i where i in range[0, bidId], i indexes a Bid in bids 
    uint public bidId;

    // Array of all swaps opened
    Swap[] public swaps;

    // Array of all bids made
    Bid[] public bids;

    // Map a seller address to the swaps it's opened 
    mapping(address => uint[]) public swapIds;

    // Map a buyer address to the bids it's made
    mapping(address => uint[]) public bidIds;

    // Emitted when a new swap is opened 
    event Opened(uint indexed id);

    // Emitted when a swap's ask is set by the seller
    event AskSet(uint indexed id);

    // Emitted when a swap's ask is accepted by a buyer
    event AskAccepted(uint indexed id);

    // Emitted when a bid is made on a swap by a bidder
    event BidMade(uint indexed id);

    // Emitted when a bid amount is set by a bidder
    event BidSet(uint indexed id);

    // Emitted when a swap's bid is accepted by the seller
    event BidAccepted(uint indexed id);

    // Emitted when a swap's buyer withdraws their purchased lpTokens and yield after lockUntilTimestamp
    event Withdrawn(uint indexed id);

    modifier isValidAddress(address _address) {
        require(_address != address(0), "YieldAndUnderlyingSwap: INVALID ADDRESS");
        _;
    }

    modifier isValidSwapId(uint id) {
        require(id <= swapId, "YieldAndUnderlyingSwap: INVALID SWAP ID");
        _;
    }

    modifier isValidBidId(uint id) {
        require(id <= bidId, "YieldAndUnderlyingSwap: INVALID BID ID");
        _;
    }

    constructor(address _chef, address _exToken, uint _MAX_LOCK_DURATION) 
        isValidAddress(_chef)
        isValidAddress(_exToken)
    {
        chef = IMasterChef(_chef);
        exToken = IERC20(_exToken);

        MAX_LOCK_DURATION = _MAX_LOCK_DURATION;
    }

    // Called externally to open a new swap
    function open(
        uint poolId,            // Id of pool to access lpToken from and stake lpToken into
        uint amount,            // Amount of lpToken to swap
        uint ask,               // Minimum amount of exToken seller is willing to sell lpToken for
        uint lockDuration       // Duration lpToken will be locked for before being withdrawable
    ) external {
        require(amount > 0, "YieldAndUnderlyingSwap: INVALID AMOUNT");
        require(0 < lockDuration && lockDuration < MAX_LOCK_DURATION, "YieldAndUnderlyingSwap: INVALID LOCK DURATION");

        require(poolId < chef.poolLength(), "YieldAndUnderlyingSwap: INVALID POOL ID");
        IERC20 lpToken = IERC20(chef.getLpToken(poolId));
        require(amount <= lpToken.balanceOf(msg.sender), "INSUFFICIENT LP TOKEN BALANCE TO OPEN");
        require(
            amount <= lpToken.allowance(msg.sender, address(this)),
            "YieldAndUnderlyingSwap: INSUFFICIENT LP TOKEN ALLOWANCE TO OPEN"
        );

        // Lock the seller's funds while the swap is open
        lpToken.safeTransferFrom(msg.sender, address(this), amount);

        // Open the swap
        uint _swapId = swapId++;
        Swap storage swap = swaps[_swapId];

        swap.lpToken = lpToken;
        swap.amount = amount;
        swap.ask = ask;
        swap.lockDuration = lockDuration;
        swap.poolId = poolId;
        swap.isOpen = true;
        
        // Reflect the created swap id in the user's account
        swapIds[msg.sender].push(_swapId);

        emit Opened(_swapId);
    }

    // Called by seller to update their swap's ask
    function setAsk(uint _swapId, uint ask) external isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(swap.isOpen, "YieldAndUnderlyingSwap: SWAP IS CLOSED");
        require(msg.sender == swap.seller, "YieldAndUnderlyingSwap: ONLY SELLER CAN SET ASK");

        swap.ask = ask;
        emit AskSet(_swapId);
    }

    // Make a bid on an open swap
    function makeBid(uint _swapId, uint amount) external isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(swap.isOpen, "YieldAndUnderlyingSwap: SWAP IS CLOSED");
        require(msg.sender != swap.seller, "YieldAndUnderlyingSwap: SELLER CAN'T BID ON OWN SWAP");
        require(!_hasBid(_swapId), "YieldAndUnderlyingSwap: CALLER HAS ALREADY BID");
        require(amount <= exToken.balanceOf(msg.sender), "INSUFFICIENT EXCHANGE TOKEN BALANCE TO MAKE BID");
        require(
            amount <= exToken.allowance(msg.sender, address(this)),
            "YieldAndUnderlyingSwap: INSUFFICIENT EXCHANGE TOKEN ALLOWANCE TO MAKE BID"
        );

        // Lock the buyer's funds while the swap is open
        exToken.safeTransferFrom(msg.sender, address(this), amount);

        // Open the bid
        uint _bidId = bidId++;
        Bid storage bid = bids[_bidId];

        bid.bidder = msg.sender;
        bid.swapId = _swapId;
        bid.amount = amount;

        // Add the bid to the swap
        swap.bidIds.push(_bidId);

        // Reflect the bid in the buyer's list of bids
        bidIds[msg.sender].push(_bidId);

        emit BidMade(_bidId);
    }

    // Called externally by a buyer to change the amount they're willing to bid
    function setBid(uint _bidId, uint amount) external isValidBidId(bidId) {
        Bid storage bid = bids[_bidId];
        Swap storage swap = swaps[bid.swapId];

        require(swap.isOpen, "YieldAndUnderlyingSwap: SWAP IS CLOSED");
        require(msg.sender == bid.bidder, "YieldAndUnderlyingSwap: CALLER IS NOT THE BIDDER");

        if (amount > bid.amount) {
            // If increasing the amount being bid,
            // add the difference between amount and previous amount
            uint amountToAdd = amount - bid.amount;

            require(
                amountToAdd <= exToken.balanceOf(msg.sender), 
                "YieldAndUnderlyingSwap: INSUFFICIENT EXCHANGE TOKEN BALANCE TO SET BID"
            );
            require(
                amountToAdd <= exToken.allowance(msg.sender, address(this)),
                "YieldAndUnderlyingSwap: INSUFFICIENT EXCHANGE TOKEN ALLOWANCE TO SET BID"
            );

            exToken.transferFrom(msg.sender, address(this), amountToAdd);
        } else if (amount < bid.amount) {
            // Otherwise, if decreasing the amount being bid,
            // return the difference between previous amount and amount
            uint amountToRemove = bid.amount - amount;
            exToken.transfer(msg.sender, amountToRemove);
        }

        emit BidSet(_bidId);
    }

    // Called externally by the seller to accept the bid and close the swap
    function acceptBid(uint _bidId) external isValidBidId(_bidId) {
        Bid storage bid = bids[_bidId];

        Swap storage swap = swaps[bid.swapId];

        require(swap.isOpen, "YieldAndUnderlyingSwap: SWAP IS CLOSED");
        require(msg.sender == swap.seller, "YieldAndUnderlyingSwap: ONLY SELLER CAN ACCEPT BID");

        swap.isOpen = false;
        swap.buyer = bid.bidder;
        swap.lockUntilTimestamp = block.timestamp + swap.lockDuration;

        // Send the seller their funds
        exToken.safeTransfer(msg.sender, bid.amount);

        // Stake the accepted amount
        chef.deposit(swap.poolId, bid.amount);

        emit BidAccepted(_bidId);
    }

    // Called by a buyer to accept the ask and close the swap
    function acceptAsk(uint _swapId) external isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(swap.isOpen, "YieldAndUnderlyingSwap: SWAP IS CLOSED");
        require(msg.sender != swap.seller, "YieldAndUnderlyingSwap: ONLY BUYER CAN ACCEPT ASK");
        require(swap.ask <= exToken.balanceOf(msg.sender), "INSUFFICIENT EXCHANGE TOKEN BALANCE TO ACCEPT ASK");
        require(
            swap.ask <= exToken.allowance(msg.sender, address(this)),
            "YieldAndUnderlyingSwap: INSUFFICIENT ALLOWANCE TO ACCEPT ASK"
        );

        swap.isOpen = false;
        swap.buyer = msg.sender;
        swap.lockUntilTimestamp = block.timestamp + swap.lockDuration;

        // send funds directly from buyer to seller
        exToken.safeTransferFrom(msg.sender, swap.seller, swap.ask);

        // Stake the accepted amount
        chef.deposit(swap.poolId, swap.ask);

        emit AskAccepted(_swapId);
    } 

    // Called to send swap buyer their purchased lpTokens plus yield
    function withdraw(uint _swapId) public isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(!swap.isOpen, "YieldAndUnderlyingSwap: SWAP IS OPEN");
        require(!swap.isWithdrawn, "YieldAndUnderlyingSwap: SWAP HAS BEEN WITHDRAWN");
        require(swap.buyer != address(0), "YieldAndUnderlyingSwap: SWAP HAD NO BUYER");
        require(block.timestamp > swap.lockUntilTimestamp, "YieldAndUnderlyingSwap: WITHDRAW IS LOCKED");

        swap.isWithdrawn = true; 

        // Withdraw the deposited lp and yield from staking and transfer directly to buyer
        chef.withdrawTo(swap.poolId, swap.amount, swap.buyer);

        emit Withdrawn(_swapId);
    }

    // Return the bid with the highest bid amount made on _swapId
    function getMaxBid(uint _swapId) external view isValidSwapId(_swapId) returns(Bid memory maxBid) {
        Swap storage swap = swaps[_swapId];
       
        uint[] memory _bidIds = swap.bidIds;

        for (uint id = 0; id < _bidIds.length; id++) {
            if (bids[id].amount > maxBid.amount) {
                maxBid = bids[id];
            }
        }
    }

    // Return true if msg.sender has bid on swapId and false otherwise
    function _hasBid(uint _swapId) private view returns(bool) {
        uint[] memory _bidIds = bidIds[msg.sender];

        for (uint id = 0; id < _bidIds.length; id++) {
            if (_swapId == bids[id].swapId) {
                return true;
            }
        }

        return false;
    }
}
