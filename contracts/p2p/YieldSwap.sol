// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IMasterChef.sol';
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/*
 * P2P swap for sellers to sell the yield on staked liquidity tokens after being locked
 * for a duration. Sellers open a swap and set the amount of liquidity tokens to
 * stake, the ask price, and the duration liquidity tokens are locked after bidding 
 * has closed. Buyers can accept the ask or make a bid. Bidding remains open until the
 * seller accepts a bid or a buyer accepts the ask. When bidding is closed, the seller 
 * recieves the bid (or ask) amount and the liquidity tokens are locked and staked until
 * the lock duration expires, after which the buyer can withdraw their liquidity tokens 
 * plus the earned yield on those tokens.
 */
contract YieldSwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
        
    // Chef contract used to generate yield on lpToken
    IMasterChef public chef;

    // Minimum duration in seconds that a swap can be locked before allowing withdrawal, 86400 == 1 day
    uint public MIN_LOCK_DURATION;

    // Maximum duration in seconds that a swap can be locked before allowing withdrawal, 86400 == 1 day
    uint public MAX_LOCK_DURATION;

    struct Swap {
        IERC20 lpToken;             // Liquidity token generating the yield being sold
        IERC20 exToken;             // Exchange token from buyer to seller for yield 
        uint[] bidIds;              // Array of ids referencing bids made on this swap 
        address seller;             // Address that opened this swap and that is selling amount of lpToken
        address buyer;              // Address of the buyer of this swap, set only after the swap is closed
        uint poolId;                // Id relating lpToken to it's appropriate pool
        uint amount;                // Amount of lpToken being staked in this swap
        uint cost;                  // Agreed cost (bid/ask) to buyer for yield, set only after swap is closed
        uint ask;                   // Amount of exToken seller is asking for in exchange for lpToken yield
        uint lockUntilTimestamp;    // Timestamp after which the buyer can withdraw their purchase of lpToken yield
        uint lockDuration;          // Duration between (buyer accepting ask or seller accepting bid) and lockUntilTimestamp
        bool isOpen;                // True if bids or ask are being accepted and false otherwise
        bool isWithdrawn;           // True if the purchase has been withdrawn by buyer and false otherwise
    }

    struct Bid {
        address bidder;             // Address making this bid
        uint swapId;                // Id of the swap this bid was made on
        uint amount;                // Amount of exToken bidder is offering in exchange for amount of lpToken and yield
    }

    // Array of all swaps opened
    Swap[] public swaps;

    // Array of all bids made
    Bid[] public bids;

    // Recipient of charged fees
    address public treasury;

    // Fee percent charged to seller
    uint public sellerFee;

    // Fee percent charged to buyer
    uint public buyerFee;

    // Max amount that a "fee" can be set to and 
    // the denominator used when calculating percentages
    // if MAX_FEE_PERCENT == 1000, then fees are out of 1000
    // so if fee == 50 that's 5% and if fee == 500 that's 50%
    uint public MAX_FEE_PERCENT;

    // Map a seller address to the swaps it's opened 
    mapping(address => uint[]) public swapIds;

    // Map a bidder address to the bids it's made
    mapping(address => uint[]) public bidIds;

    // Used for cheap lookup for whether an address has bid on a Swap 
    // True if the address has bid on the swapId and false otherwise
    mapping(address => mapping(uint => bool)) public hasBidOnSwap;

    // Map a bidder address to the swapIds it's bid on
    mapping(address => uint[]) public bidderSwapIds;

    // Emitted when a new swap is opened 
    event SwapOpened(uint indexed id);

    // Emitted when a swap is closed with no buyer
    event SwapClosed(uint indexed id);

    // Emitted when a swap's ask is set by the seller
    event AskSet(uint indexed id);

    // Emitted when a swap's ask is accepted by a buyer
    event AskAccepted(uint indexed id);

    // Emitted when a bid is made on a swap by a bidder
    event BidMade(uint indexed id);

    // Emitted when a bid is withdrawn by a bidder after the swap has closed
    event BidWithdrawn(uint indexed id);

    // Emitted when a bid amount is set by a bidder
    event BidSet(uint indexed id);

    // Emitted when a swap's bid is accepted by the seller
    event BidAccepted(uint indexed id);

    // Emitted when a swap's buyer withdraws their purchased lpTokens and yield after lockUntilTimestamp
    event Withdrawn(uint indexed id);

    // Emitted when the owner sets the treasury
    event TreasurySet(address treasury);

    // Emitted when the owner sets the seller's fee
    event SellerFeeSet(uint sellerFee);

    // Emitted when the owner sets the buyer's fee
    event BuyerFeeSet(uint buyerFee);

    // Emitted when the owner sets the minimum lock duration 
    event MinLockDurationSet(uint minLockDuration);

    // Emitted when the owner sets the maximum lock duration 
    event MaxLockDurationSet(uint maxLockDuration);

    modifier isValidSwapId(uint id) {
        require(swaps.length != 0, "YieldSwap: no swap opened");
        require(id < swaps.length, "YieldSwap: invalid swap id");
        _;
    }

    modifier isValidBidId(uint id) {
        require(bids.length != 0, "YieldSwap: no bid made");
        require(id < bids.length, "YieldSwap: invalid bid id");
        _;
    }

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "YieldSwap: zero address");
        _;
    }

    modifier isAboveZero(uint256 number) {
        require(number > 0, "YieldSwap: not above zero");
        _;
    }

    modifier isValidFee(uint256 _fee) {
        require(_fee <= MAX_FEE_PERCENT, "YieldSwap: invalid fee");
        _;
    }

    constructor(
        IMasterChef _chef, 
        address _treasury,
        uint _MIN_LOCK_DURATION,
        uint _MAX_LOCK_DURATION
    ) 
        isNotZeroAddress(address(_chef))
    {
        chef = _chef;
        treasury = _treasury;

        MIN_LOCK_DURATION = _MIN_LOCK_DURATION;
        MAX_LOCK_DURATION = _MAX_LOCK_DURATION;

        MAX_FEE_PERCENT = 1000;
    }

    // Called externally to open a new swap
    function openSwap(
        IERC20 exToken,         // Token paid by buyer to seller in exchange for lpToken
        uint poolId,            // Id of pool to access lpToken from and stake lpToken into
        uint amount,            // Amount of lpToken to swap
        uint ask,               // Amount of exToken seller is asking to sell lpToken for
        uint lockDuration       // Duration lpToken will be locked before being withdrawable
    ) 
        external
        isNotZeroAddress(address(exToken))
        isAboveZero(amount)
    {
        require(
            MIN_LOCK_DURATION <= lockDuration && lockDuration <= MAX_LOCK_DURATION, 
            "YieldSwap: invalid min lock duration"
        );
        require(poolId < chef.poolLength(), "YieldSwap: invalid pool id");

        IERC20 lpToken = IERC20(chef.getLpToken(poolId));
        _requireValidBalanceAndAllowance(lpToken, msg.sender, amount);

        // Open the swap
        Swap memory swap;
        swap.lpToken = lpToken;
        swap.exToken = exToken;
        swap.seller = msg.sender;
        swap.amount = amount;
        swap.ask = ask;
        swap.lockDuration = lockDuration;
        swap.poolId = poolId;
        swap.isOpen = true;

        // Add it to the swaps array
        swaps.push(swap);

        uint _swapId = _getSwapId();

        // Reflect the created swap id in the user's account
        swapIds[msg.sender].push(_swapId);

        emit SwapOpened(_swapId);
    }

    // Called by seller to update the swap's ask
    function setAsk(uint _swapId, uint ask) external {
        Swap storage swap = _getSwap(_swapId);
    
        _requireIsOpen(swap.isOpen);
        _requireIsSeller(msg.sender, swap.seller);

        swap.ask = ask;
        emit AskSet(_swapId);
    }
    
    // Called by seller to close the swap and withdraw their lpTokens
    function closeSwap(uint _swapId) external {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.isOpen);
        _requireIsSeller(msg.sender, swap.seller);

        swap.isOpen = false;
        emit SwapClosed(_swapId);
    }

    // Make a new bid on an open swap
    function makeBid(uint _swapId, uint amount) external isAboveZero(amount) {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.isOpen);
        _requireIsNotSeller(msg.sender, swap.seller);
        require(!hasBidOnSwap[msg.sender][_swapId], "YieldSwap: caller has already bid");
        _requireValidBalanceAndAllowance(swap.exToken, msg.sender, amount);

        // Open the swap
        Bid memory bid;
        bid.bidder = msg.sender;
        bid.swapId = _swapId;
        bid.amount = amount;

        // Add it to the bids array
        bids.push(bid);

        uint bidId = _getBidId();

        // Reflect the new bid in the swap
        swap.bidIds.push(bidId);

        // Reflect the new bid in the buyer's list of bids
        bidIds[msg.sender].push(bidId);

        // Reflect that the user has bid on this swap
        hasBidOnSwap[msg.sender][_swapId] = true;
        bidderSwapIds[msg.sender].push(_swapId);

        emit BidMade(bidId);
    }

    // Called externally by a bidder while bidding is open to set the amount being bid
    function setBid(uint _bidId, uint amount) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
   
        _requireIsOpen(swap.isOpen);
        require(msg.sender == bid.bidder, "YieldSwap: caller is not bidder");
        _requireValidBalanceAndAllowance(swap.exToken, msg.sender, amount);

        bid.amount = amount;

        emit BidSet(_bidId);
    }

    // Called externally by the seller to accept the bid and close the swap
    function acceptBid(uint _bidId) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
    
        _requireIsSeller(msg.sender, swap.seller);
        _accept(swap, msg.sender, bid.bidder, bid.swapId, bid.amount);

        emit BidAccepted(_bidId);
    }

    // Called by a buyer to accept the ask and close the swap
    function acceptAsk(uint _swapId) external {
        Swap storage swap = _getSwap(_swapId);
    
        _requireIsNotSeller(msg.sender, swap.seller);
        _accept(swap, swap.seller, msg.sender, _swapId, swap.ask);

        emit AskAccepted(_swapId);
    } 

    // Called internally to accept a bid or an ask, perform the
    // necessary checks, and transfer funds
    function _accept(
        Swap storage swap,      // swap being accepted and closed
        address seller,         // seller of the swap
        address buyer,          // buyer of the swap
        uint swapId,            // id of swap being accepted and closed
        uint exAmount           // amount paid by buyer in exToken to seller for yield
    ) private {
        _requireIsOpen(swap.isOpen);

        IERC20 lpToken = swap.lpToken;
        _requireValidBalanceAndAllowance(lpToken, seller, swap.amount);

        IERC20 exToken = swap.exToken;
        _requireValidBalanceAndAllowance(exToken, buyer, exAmount);

        swap.isOpen = false;
        swap.buyer = buyer;
        swap.cost = exAmount;
        swap.lockUntilTimestamp = block.timestamp + swap.lockDuration;

        // Lock and stake lpAmount of the seller's lpToken
        uint lpAmount = swap.amount;
        lpToken.safeTransferFrom(seller, address(this), lpAmount);

        // Approve the chef contract to enable deposit and stake lpToken
        lpToken.approve(address(chef), lpAmount);
        chef.bucketDeposit(swapId, swap.poolId, lpAmount);
        
        // Transfer exAmount from the buyer to the seller minus the treasury fee
        (uint sellerAmount, uint treasuryAmount) = _applySellerFee(exAmount);
        exToken.transferFrom(buyer, treasury, treasuryAmount);
        exToken.transferFrom(buyer, seller, sellerAmount);
    }

    // Called externally after lock duration to return swap 
    // seller's lpTokens and swap buyer's yield
    function withdraw(uint _swapId) external {
        Swap storage swap = _getSwap(_swapId);

        require(!swap.isOpen, "YieldSwap: swap not closed");
        require(!swap.isWithdrawn, "YieldSwap: swap is withdrawn");
        require(swap.buyer != address(0), "YieldSwap: swap had no buyer");
        require(block.timestamp >= swap.lockUntilTimestamp, "YieldSwap: swap is locked");

        // Prevent further withdrawals
        swap.isWithdrawn = true; 

        // Unstake the lpTokens and return to seller 
        chef.bucketWithdrawAmountTo(swap.seller, _swapId, swap.poolId, swap.amount);

        // Get the total yield to withdraw
        uint yield = chef.getBucketYield(_swapId, swap.poolId);

        // Apply the buyer fee to the yield to get the amounts to send to the buyer and treasury
        (uint buyerAmount, uint treasuryAmount) = _applyBuyerFee(yield);

        // Send the buyer and treasury their respective portions of the yield
        chef.bucketWithdrawYieldTo(treasury, _swapId, swap.poolId, treasuryAmount);
        chef.bucketWithdrawYieldTo(swap.buyer, _swapId, swap.poolId, buyerAmount);

        emit Withdrawn(_swapId);
    }

    // Verify that _address has amount of token in balance
    // and that _address has approved this contract to transfer amount
    function _requireValidBalanceAndAllowance(IERC20 token, address _address, uint amount) private view {
        require(amount <= token.balanceOf(_address), "YieldSwap: insufficient balance");
        require(
            amount <= token.allowance(_address, address(this)),
            "YieldSwap: insufficient allowance"
        );
    }

    // Return the array of swapIds made by _address
    function getSwapIds(address _address) external view returns(uint[] memory) {
        return swapIds[_address];
    }

    // Return the array of bidIds made by _address
    function getBidIds(address _address) external view returns(uint[] memory) {
        return bidIds[_address];
    }

    // Get the current swap id such that 
    // for swapId i in range[0, swaps.length) i indexes a Swap in swaps
    function getSwapId() external view returns(uint) {
        return _getSwapId();
    }

    function _getSwapId() private view returns(uint) {
        if (swaps.length != 0) {
            return swaps.length - 1;
        } else {
            return 0;
        }
    }

    // Get the current bid id such that 
    // for bid id i in range[0, bids.length) i indexes a Bid in bids 
    function getBidId() external view returns(uint) {
        return _getBidId();
    }

    function _getBidId() private view returns(uint) {
        if (bids.length != 0) {
            return bids.length - 1;
        } else {
            return 0;
        }
    }

    // Return the swap associated with the given bidId
    function getSwap(uint _swapId) external view returns(Swap memory) {
        return _getSwap(_swapId);
    }

    function _getSwap(uint _swapId) 
        private 
        view 
        isValidSwapId(_swapId) 
        returns(Swap storage) 
    {
        return swaps[_swapId];
    }
    
    // Return the bid associated with the given bidId
    function getBid(uint _bidId) external view returns(Bid memory) {
        return _getBid(_bidId);
    }

    function _getBid(uint _bidId) 
        private 
        view 
        isValidBidId(_bidId) 
        returns(Bid storage) 
    {
        return bids[_bidId];
    }

    // Return the array of all swapIds bid on by _address
    function getBidderSwapIds(address _address) external view isNotZeroAddress(_address) returns(uint[] memory _bidderSwapIds) {
        _bidderSwapIds = bidderSwapIds[_address];
    }

    // Return the array of all opened swaps
    function getSwaps() external view returns(Swap[] memory) {
        return swaps;
    }

    function setTreasury(address _treasury) external onlyOwner isNotZeroAddress(_treasury) {
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function setSellerFee(uint _sellerFee) external onlyOwner isValidFee(_sellerFee) {
        sellerFee = _sellerFee;
        emit SellerFeeSet(_sellerFee);
    }

    function setBuyerFee(uint _buyerFee) external onlyOwner isValidFee(_buyerFee) {
        buyerFee = _buyerFee;
        emit BuyerFeeSet(_buyerFee);
    }

    // Apply the seller fee and get the amounts that go to the seller and to the treasury
    function applySellerFee(uint amount) external view returns(uint sellerAmount, uint treasuryAmount) {
        (sellerAmount, treasuryAmount) = _applySellerFee(amount);
    }

    function _applySellerFee(uint amount) private view returns(uint sellerAmount, uint treasuryAmount) {
        treasuryAmount = amount * sellerFee / MAX_FEE_PERCENT;
        sellerAmount = amount - treasuryAmount;
    }

    // Apply the buyer fee and get the amounts that go to the buyer and to the treasury
    function applyBuyerFee(uint amount) external view returns(uint buyerAmount, uint treasuryAmount) {
        (buyerAmount, treasuryAmount) = _applyBuyerFee(amount);
    }

    function _applyBuyerFee(uint amount) private view returns(uint buyerAmount, uint treasuryAmount) {
        treasuryAmount = amount * buyerFee / MAX_FEE_PERCENT;
        buyerAmount = amount - treasuryAmount;
    }

    function setMinLockDuration(uint _MIN_LOCK_DURATION) external onlyOwner {
        require(
            _MIN_LOCK_DURATION < MAX_LOCK_DURATION, 
            "YieldSwap: invalid min lock duration"
        );
        MIN_LOCK_DURATION = _MIN_LOCK_DURATION;
        emit MinLockDurationSet(_MIN_LOCK_DURATION);
    }

    function setMaxLockDuration(uint _MAX_LOCK_DURATION) external onlyOwner {
        require(
            MIN_LOCK_DURATION < _MAX_LOCK_DURATION, 
            "YieldSwap: invalid max lock duration"
        );
        MAX_LOCK_DURATION = _MAX_LOCK_DURATION;
        emit MaxLockDurationSet(_MAX_LOCK_DURATION);
    }

    function _requireIsOpen(bool isOpen) private pure {
        require(isOpen, "YieldSwap: swap is closed");
    }

    function _requireIsSeller(address caller, address seller) private pure {
        require(caller == seller, "YieldSwap: caller is not seller");
    }

    function _requireIsNotSeller(address caller, address seller) private pure {
        require(caller != seller, "YieldSwap: caller is seller");
    }
}
