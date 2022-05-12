// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IMasterChef.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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

    struct Swap {
        Party seller;                   // Address that opened this swap and that is selling amount of toBuyerToken
        Party buyer;                    // Address of the buyer of this swap, set only after the swap is closed
        Status status;                  // The status of this swap: open, closed, or withdrawn
        uint[] bidIds;                  // Array of ids referencing bids made on this swap 
        uint256 ask;                    // Amount of toSellerToken seller is asking for in exchange for toBuyerToken amount/yield
        uint256 lockUntilTimestamp;     // Timestamp after which tokens are unstaked and returned to owners and yield distributed
        uint256 lockDuration;           // Duration between (buyer accepting ask or seller accepting bid) and lockUntilTimestamp
    }

    struct Bid {
        address bidder;                 // Address making this bid
        uint256 swapId;                 // Id of the swap this bid was made on
        uint256 amount;                 // Amount of toSellerToken bidder is offering in exchange toBuyerToken amount/yield
    }
    
    // Defines one of a swap's parties, i.e. party/counterparty or seller/buyer
    struct Party {
        IERC20 token;                   // Token being swapped or staked with amount or yield being transferred to other party
        address party;                  // Party swapping or staking amount of token to other party
        uint256 amount;                 // Amount of token being swapped or staked to other party
        bool isLp;                      // True if token is an lp token to be staked and yield transferred and false otherwise
    }
    
    // Defines the status of a swap and determines it's permitted interactions
    enum Status {
        Open,                           // Swap doesn't have a buyer so bids can be made and bids/ask accepted
        Closed,                         // Swap has a buyer so bids can't be made and bid/ask already accepted
        Withdrawn                       // Tokens have been unstaked and returned and yield has been distributed
    }

    // Chef contract used to generate yield on toBuyerToken
    IMasterChef public chef;

    // Minimum duration in seconds that a swap can be locked before allowing withdrawal, 86400 == 1 day
    uint256 public MIN_LOCK_DURATION;

    // Maximum duration in seconds that a swap can be locked before allowing withdrawal, 86400 == 1 day
    uint256 public MAX_LOCK_DURATION;

    // Array of all swaps opened
    Swap[] public swaps;

    // Array of all bids made
    Bid[] public bids;

    // Recipient of charged fees
    address public treasury;

    // Fee percent charged to seller
    uint256 public sellerFee;

    // Fee percent charged to buyer
    uint256 public buyerFee;

    // Max amount that a "fee" can be set to and 
    // the denominator used when calculating percentages
    // if MAX_FEE_PERCENT == 1000, then fees are out of 1000
    // so if fee == 50 that's 5% and if fee == 500 that's 50%
    uint256 public constant MAX_FEE_PERCENT = 1000;

    // Map a seller address to the swaps it's opened 
    mapping(address => uint[]) public swapIds;

    // Map a bidder address to the bids it's made
    mapping(address => uint[]) public bidIds;

    // Used for cheap lookup for whether an address has bid on a Swap 
    // True if the address has bid on the swapId and false otherwise
    mapping(address => mapping(uint256 => bool)) public hasBidOnSwap;

    // Map a bidder address to the swapIds it's bid on
    mapping(address => uint[]) public bidderSwapIds;

    // Emitted when a new swap is opened 
    event SwapOpened(
        IERC20 indexed toBuyerToken,
        IERC20 indexed toSellerToken,
        address indexed seller,
        uint256 swapId
    );

    // Emitted when a swap is closed with no buyer
    event SwapClosed(uint256 indexed id);

    // Emitted when a swap's ask is set by the seller
    event AskSet(uint256 indexed id);

    // Emitted when a swap's ask is accepted by a buyer
    event AskAccepted(uint256 indexed id);

    // Emitted when a bid is made on a swap by a bidder
    event BidMade(uint256 indexed id);

    // Emitted when a bid is withdrawn by a bidder after the swap has closed
    event BidWithdrawn(uint256 indexed id);

    // Emitted when a bid amount is set by a bidder
    event BidSet(uint256 indexed id);

    // Emitted when a swap's bid is accepted by the seller
    event BidAccepted(uint256 indexed id);

    // Emitted when a swap's buyer withdraws their purchased toBuyerTokens and yield after lockUntilTimestamp
    event Withdrawn(uint256 indexed id);

    // Emitted when the owner sets the treasury
    event TreasurySet(address treasury);

    // Emitted when the owner sets the seller's fee
    event SellerFeeSet(uint256 sellerFee);

    // Emitted when the owner sets the buyer's fee
    event BuyerFeeSet(uint256 buyerFee);

    // Emitted when the owner sets the minimum lock duration 
    event MinLockDurationSet(uint256 minLockDuration);

    // Emitted when the owner sets the maximum lock duration 
    event MaxLockDurationSet(uint256 maxLockDuration);

    modifier onlyValidSwapId(uint256 id) {
        require(swaps.length != 0, "YieldSwap: no swap opened");
        require(id < swaps.length, "YieldSwap: invalid swap id");
        _;
    }

    modifier onlyValidBidId(uint256 id) {
        require(bids.length != 0, "YieldSwap: no bid made");
        require(id < bids.length, "YieldSwap: invalid bid id");
        _;
    }

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "YieldSwap: zero address");
        _;
    }

    modifier onlyAboveZero(uint256 number) {
        require(number > 0, "YieldSwap: not above zero");
        _;
    }

    modifier onlyValidFee(uint256 _fee) {
        require(_fee <= MAX_FEE_PERCENT, "YieldSwap: invalid fee");
        _;
    }

    constructor(
        IMasterChef _chef, 
        address _treasury,
        uint256 _MIN_LOCK_DURATION,
        uint256 _MAX_LOCK_DURATION
    ) 
        onlyValidAddress(address(_chef))
    {
        chef = _chef;
        treasury = _treasury;

        MIN_LOCK_DURATION = _MIN_LOCK_DURATION;
        MAX_LOCK_DURATION = _MAX_LOCK_DURATION;
    }

    // Called externally to open a new swap
    function openSwap(
        IERC20 _toBuyerToken,       // Token being sold or staked with amount or yield going to buyer
        IERC20 _toSellerToken,      // Token being sold or staked with amount or yield going to seller
        uint256 _amount,            // Amount of toBuyerToken to sell or stake
        uint256 _ask,               // Amount of toSellerToken seller is asking for to sell or stake
        uint256 _lockDuration,      // Duration lp tokens will be locked before being withdrawable
        bool _toBuyerTokenIsLp,     // True if _toBuyerToken is an lp token to stake and false otherwise
        bool _toSellerTokenIsLp     // True if _toSellerToken is an lp token to stake and false otherwise
    ) 
        external
        onlyValidAddress(address(_toBuyerToken))
        onlyValidAddress(address(_toSellerToken))
        onlyAboveZero(_amount)
    {
        require(
            MIN_LOCK_DURATION <= _lockDuration && _lockDuration <= MAX_LOCK_DURATION, 
            "YieldSwap: invalid min lock duration"
        );
        _requireValidBalanceAndAllowance(_toBuyerToken, msg.sender, _amount);
        require(_toBuyerTokenIsLp || _toSellerTokenIsLp, "YieldSwap: no lp token");
        if (_toBuyerTokenIsLp) {
            _requireValidLpToken(_toBuyerToken);
        }
        if (_toSellerTokenIsLp) {
            _requireValidLpToken(_toSellerToken);
        }

        // Fill out the seller struct
        Party memory seller;
        seller.token = _toBuyerToken;
        seller.party = msg.sender;
        seller.amount = _amount;
        seller.isLp = _toBuyerTokenIsLp;

        // Fill in part of the buyer struct
        Party memory buyer;
        buyer.token = _toSellerToken;
        buyer.isLp = _toSellerTokenIsLp;

        // Fill in part of the swap struct
        Swap memory swap;
        swap.seller = seller;
        swap.buyer = buyer;
        swap.status = Status.Open;
        swap.ask = _ask;
        swap.lockDuration = _lockDuration;

        // Add the swap to the array
        swaps.push(swap);
        
        // Get the current swapId
        uint256 _swapId = _getSwapId();

        // And reflect the created swap id in the user's account
        swapIds[msg.sender].push(_swapId);

        emit SwapOpened(
            _toBuyerToken,
            _toSellerToken,
            msg.sender,
            _swapId
        );
    }

    // Called by seller to update the swap's ask
    function setAsk(uint256 _swapId, uint256 _ask) external {
        Swap storage swap = _getSwap(_swapId);
    
        _requireIsOpen(swap.status);
        _requireIsSeller(msg.sender, swap.seller.party);

        swap.ask = _ask;
        emit AskSet(_swapId);
    }
    
    // Called by seller to permanently close/cancel the swap
    function closeSwap(uint256 _swapId) external {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.status);
        _requireIsSeller(msg.sender, swap.seller.party);

        swap.status = Status.Closed;
        emit SwapClosed(_swapId);
    }

    // Make a new bid on an open swap
    function makeBid(uint256 _swapId, uint256 _amount) external onlyAboveZero(_amount) {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.status);
        _requireIsNotSeller(msg.sender, swap.seller.party);
        require(!hasBidOnSwap[msg.sender][_swapId], "YieldSwap: caller has already bid");
        _requireValidBalanceAndAllowance(swap.buyer.token, msg.sender, _amount);

        // Open the swap
        Bid memory bid;
        bid.bidder = msg.sender;
        bid.swapId = _swapId;
        bid.amount = _amount;

        // Add it to the contract's bids array
        bids.push(bid);

        // Get the bid id
        uint256 bidId = _getBidId();

        // And reflect the new bid on the swap
        swap.bidIds.push(bidId);

        // And reflect the new bid in the buyer's list of bids
        bidIds[msg.sender].push(bidId);

        // Reflect that the user has bid on this swap
        hasBidOnSwap[msg.sender][_swapId] = true;
        bidderSwapIds[msg.sender].push(_swapId);

        emit BidMade(bidId);
    }

    // Called externally by a bidder while bidding is open to set the amount being bid
    function setBid(uint256 _bidId, uint256 _amount) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
   
        _requireIsOpen(swap.status);
        require(msg.sender == bid.bidder, "YieldSwap: caller is not bidder");
        _requireValidBalanceAndAllowance(swap.buyer.token, msg.sender, _amount);

        bid.amount = _amount;

        emit BidSet(_bidId);
    }

    // Called externally by the seller to accept the bid and close the swap
    function acceptBid(uint256 _bidId) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
    
        _requireIsSeller(msg.sender, swap.seller.party);
        _accept(swap, msg.sender, bid.bidder, bid.swapId, bid.amount);

        emit BidAccepted(_bidId);
    }

    // Called by a buyer to accept the ask and close the swap
    function acceptAsk(uint256 _swapId) external {
        Swap storage swap = _getSwap(_swapId);
    
        _requireIsNotSeller(msg.sender, swap.seller.party);
        _accept(swap, swap.seller.party, msg.sender, _swapId, swap.ask);

        emit AskAccepted(_swapId);
    } 

    // Called internally to accept a bid or an ask, perform the
    // necessary checks, and transfer funds
    function _accept(
        Swap storage swap,      // swap being accepted and closed
        address _seller,         // seller of the swap
        address _buyer,          // buyer of the swap
        uint256 _swapId,            // id of swap being accepted and closed
        uint256 _exAmount           // amount paid by buyer in toSellerToken to seller for yield
    ) private {
        _requireIsOpen(swap.status);

        swap.status = Status.Closed;
        swap.buyer.party = _buyer;
        swap.buyer.amount = _exAmount;
        swap.lockUntilTimestamp = block.timestamp + swap.lockDuration;


        IERC20 toBuyerToken = swap.seller.token;
        _requireValidBalanceAndAllowance(toBuyerToken, _seller, swap.seller.amount);

        IERC20 toSellerToken = swap.buyer.token;
        _requireValidBalanceAndAllowance(toSellerToken, _buyer, _exAmount);

           // Lock and stake lpAmount of the seller's toBuyerToken
        uint256 lpAmount = swap.seller.amount;
        toBuyerToken.safeTransferFrom(_seller, address(this), lpAmount);

        // Approve the chef contract to enable deposit and stake toBuyerToken
        toBuyerToken.approve(address(chef), lpAmount);
        // chef.bucketDeposit(swapId, swap.poolId, lpAmount);
        
        // Transfer exAmount from the buyer to the seller minus the treasury fee
        (uint256 sellerAmount, uint256 treasuryAmount) = _applySellerFee(_exAmount);
        toSellerToken.transferFrom(_buyer, treasury, treasuryAmount);
        toSellerToken.transferFrom(_buyer, _seller, sellerAmount);
    }

    function _transferOrStake(Party memory _party, Party memory _counterparty, uint256 _swapId, bool _partyIsSeller) private {
        IERC20 token = _party.token;
        address party = _party.party;
        uint256 amount = _party.amount;
        bool isLp = _party.isLp;

        _requireValidBalanceAndAllowance(token, party, amount);
    
        // Stake the token if it's an lp token
        if (isLp) {
            // Transfer the amount of token from party to this contract
            token.safeTransferFrom(party, address(this), amount);

            // Approve the chef to manage amount of this token in this contract
            token.approve(address(chef), amount);

            // Get the poolId for this token (already confirmed that pool exists when opening swap)
            uint256 poolId = chef.getPoolId(address(token));

            // TODO check what happens with clashing swap/pool Id
            // Deposit amount of token in the pool identified by the _swapId
            chef.bucketDeposit(_swapId, poolId, amount);
        } else { 
            // Apply the treasury fee
            uint256 counterpartyAmount;
            uint256 treasuryAmount;
            if (_partyIsSeller) {
                (counterpartyAmount, treasuryAmount) = _applySellerFee(amount);
            } else {
                (counterpartyAmount, treasuryAmount) = _applyBuyerFee(amount);
            }

            // Transfer the amounts from the party to the counterparty and treasury
            token.transferFrom(party, _counterparty.party, counterpartyAmount);
            token.transferFrom(party, treasury, treasuryAmount);
        }
    }

    // Called externally after lock duration to return swap 
    // seller's toBuyerTokens and swap buyer's yield
    function withdraw(uint256 _swapId) external {
        Swap storage swap = _getSwap(_swapId);

        require(swap.status == Status.Closed, "YieldSwap: swap not closed");
        require(swap.buyer.party != address(0), "YieldSwap: swap had no buyer");
        require(block.timestamp >= swap.lockUntilTimestamp, "YieldSwap: swap is locked");

        // Prevent further withdrawals
        swap.status = Status.Withdrawn; 

        // Unstake the toBuyerTokens and return to seller 
        // chef.bucketWithdrawAmountTo(swap.seller, _swapId, swap.poolId, swap.amount);

        // Get the total yield to withdraw
        // uint256 yield = chef.getBucketYield(_swapId, swap.poolId);

        // Apply the buyer fee to the yield to get the amounts to send to the buyer and treasury
        // (uint256 buyerAmount, uint256 treasuryAmount) = _applyBuyerFee(yield);

        // Send the buyer and treasury their respective portions of the yield
        // chef.bucketWithdrawYieldTo(treasury, _swapId, swap.poolId, treasuryAmount);
        // chef.bucketWithdrawYieldTo(swap.buyer, _swapId, swap.poolId, buyerAmount);

        emit Withdrawn(_swapId);
    }

    // Verify that _address has amount of token in balance
    // and that _address has approved this contract to transfer amount
    function _requireValidBalanceAndAllowance(IERC20 token, address _address, uint256 amount) private view {
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
    function getSwap(uint256 _swapId) external view returns(Swap memory) {
        return _getSwap(_swapId);
    }

    function _getSwap(uint256 _swapId) 
        private 
        view 
        onlyValidSwapId(_swapId) 
        returns(Swap storage) 
    {
        return swaps[_swapId];
    }
    
    // Return the bid associated with the given bidId
    function getBid(uint256 _bidId) external view returns(Bid memory) {
        return _getBid(_bidId);
    }

    function _getBid(uint256 _bidId) 
        private 
        view 
        onlyValidBidId(_bidId) 
        returns(Bid storage) 
    {
        return bids[_bidId];
    }

    // Return the array of all swapIds bid on by _address
    function getBidderSwapIds(address _address) external view onlyValidAddress(_address) returns(uint[] memory _bidderSwapIds) {
        _bidderSwapIds = bidderSwapIds[_address];
    }

    // Return the array of all opened swaps
    function getSwaps() external view returns(Swap[] memory) {
        return swaps;
    }

    function setTreasury(address _treasury) external onlyOwner onlyValidAddress(_treasury) {
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function setSellerFee(uint256 _sellerFee) external onlyOwner onlyValidFee(_sellerFee) {
        sellerFee = _sellerFee;
        emit SellerFeeSet(_sellerFee);
    }

    function setBuyerFee(uint256 _buyerFee) external onlyOwner onlyValidFee(_buyerFee) {
        buyerFee = _buyerFee;
        emit BuyerFeeSet(_buyerFee);
    }

    // Apply the seller fee and get the amounts that go to the seller and to the treasury
    function applySellerFee(uint256 amount) external view returns(uint256 sellerAmount, uint256 treasuryAmount) {
        (sellerAmount, treasuryAmount) = _applySellerFee(amount);
    }

    function _applySellerFee(uint256 amount) private view returns(uint256 sellerAmount, uint256 treasuryAmount) {
        treasuryAmount = amount * sellerFee / MAX_FEE_PERCENT;
        sellerAmount = amount - treasuryAmount;
    }

    // Apply the buyer fee and get the amounts that go to the buyer and to the treasury
    function applyBuyerFee(uint256 amount) external view returns(uint256 buyerAmount, uint256 treasuryAmount) {
        (buyerAmount, treasuryAmount) = _applyBuyerFee(amount);
    }

    function _applyBuyerFee(uint256 amount) private view returns(uint256 buyerAmount, uint256 treasuryAmount) {
        treasuryAmount = amount * buyerFee / MAX_FEE_PERCENT;
        buyerAmount = amount - treasuryAmount;
    }

    function setMinLockDuration(uint256 _MIN_LOCK_DURATION) external onlyOwner {
        require(
            _MIN_LOCK_DURATION < MAX_LOCK_DURATION, 
            "YieldSwap: invalid min lock duration"
        );
        MIN_LOCK_DURATION = _MIN_LOCK_DURATION;
        emit MinLockDurationSet(_MIN_LOCK_DURATION);
    }

    function setMaxLockDuration(uint256 _MAX_LOCK_DURATION) external onlyOwner {
        require(
            MIN_LOCK_DURATION < _MAX_LOCK_DURATION, 
            "YieldSwap: invalid max lock duration"
        );
        MAX_LOCK_DURATION = _MAX_LOCK_DURATION;
        emit MaxLockDurationSet(_MAX_LOCK_DURATION);
    }

    function _requireIsOpen(Status _status) private pure {
        require(_status == Status.Open, "YieldSwap: swap is closed");
    }

    function _requireIsSeller(address caller, address seller) private pure {
        require(caller == seller, "YieldSwap: caller is not seller");
    }

    function _requireIsNotSeller(address caller, address seller) private pure {
        require(caller != seller, "YieldSwap: caller is seller");
    }

    function _requireValidLpToken(IERC20 _lpToken) private view {
        // Implicitly check that token has been added to pool
        uint256 poolId = chef.getPoolId(address(_lpToken));
        require(poolId != 0, "YieldSwap: no staking helix");
    }
}
