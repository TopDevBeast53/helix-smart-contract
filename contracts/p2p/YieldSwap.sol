// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IMasterChef.sol";
import "../fees/FeeCollector.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * Enable users (party/counterparty or seller/buyer) to engage in p2p token pair 
 * swaps and negotiate on the price. A swap is arbitrary in that it can involve any 
 * combination of stable token and liquidity token pairs with possible swap combinations 
 * being: (with seller initiating)
 *      yield for coin
 *      coin for yield
 *      yield for yield
 *
 * A swap order is opened by a seller. The seller determines which tokens are involved
 * in the swap, how many tokens they (the seller) are offering, the duration over 
 * which liquidity tokens are staked generating yield, and an asking price. 
 * 
 * After a swap is opened, prospective buyers can bid on a swap, adjust their bid amount,
 * and/or accept the seller's ask - closing the swap. The seller can adjust their ask amount,
 * close the order, or accept a bid - closing the swap. When a swap is closed, the buyer
 * and the amount being exchanged from the buyer to the seller is set.
 *
 * After a swap is closed, stable tokens are immediately exchanged between parties while
 * liquidity tokens are staked and the swap is locked until the duration has elapsed. 
 * 
 * After the duration has elapsed, either party can initiate a withdrawal which unstakes
 * staked liquidity tokens. The party that initially held the liquidity token receives their 
 * staked amount of liquidity token and their counterparty receives the yield earned over 
 * the duration.
 */
contract YieldSwap is Ownable, FeeCollector, ReentrancyGuard {
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

    /// Chef contract used to generate yield on toBuyerToken
    IMasterChef public chef;

    /// Minimum duration in seconds that a swap can be locked before allowing withdrawal
    uint256 public MIN_LOCK_DURATION;

    /// Maximum duration in seconds that a swap can be locked before allowing withdrawal
    uint256 public MAX_LOCK_DURATION;

    /// Array of all swaps opened
    Swap[] public swaps;

    /// Array of all bids made
    Bid[] public bids;

    /// Map a seller address to the swaps it's opened 
    mapping(address => uint[]) public swapIds;

    /// Map a bidder address to the bids it's made
    mapping(address => uint[]) public bidIds;

    /// Used for cost efficient lookup on whether an address has bid on a Swap 
    /// True if the address has bid on the swapId and false otherwise
    mapping(address => mapping(uint256 => bool)) public hasBidOnSwap;

    /// Map a bidder address to the swapIds it's bid on
    mapping(address => uint[]) public bidderSwapIds;

    // Emitted when a new swap is opened 
    event SwapOpened(uint256 indexed swapId);

    // Emitted when a swap is closed with no buyer
    event SwapClosed(uint256 indexed swapId);

    // Emitted when a swap's ask is set by the seller
    event AskSet(uint256 indexed swapId);

    // Emitted when a swap's ask is accepted by a buyer
    event AskAccepted(uint256 indexed swapId);

    // Emitted when a bid is made on a swap by a bidder
    event BidMade(uint256 indexed bidId);

    // Emitted when a bid amount is set by a bidder
    event BidSet(uint256 indexed bidId);

    // Emitted when a swap's bid is accepted by the seller
    event BidAccepted(uint256 indexed bidId);

    // Emitted when a swap's lp token(s) is withdrawn after being locked
    event Withdrawn(uint256 indexed swapId);

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

    /// Open a new swap
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
        require(address(_toBuyerToken) != address(_toSellerToken), "YieldSwap: identical tokens");
        require(
            MIN_LOCK_DURATION <= _lockDuration && _lockDuration <= MAX_LOCK_DURATION, 
            "YieldSwap: invalid min lock duration"
        );
        require(_toBuyerTokenIsLp || _toSellerTokenIsLp, "YieldSwap: no lp token");
        if (_toBuyerTokenIsLp) {
            _requireValidLpToken(_toBuyerToken);
        }
        if (_toSellerTokenIsLp) {
            _requireValidLpToken(_toSellerToken);
        }
        _requireValidBalanceAndAllowance(_toBuyerToken, msg.sender, _amount);

        // Fill out the seller struct
        Party memory seller;
        seller.token = _toBuyerToken;
        seller.party = msg.sender;
        seller.amount = _amount;
        seller.isLp = _toBuyerTokenIsLp;

        // Fill out part of the buyer struct
        Party memory buyer;
        buyer.token = _toSellerToken;
        buyer.isLp = _toSellerTokenIsLp;

        // Fill out part of the swap struct
        Swap memory swap;
        swap.seller = seller;
        swap.buyer = buyer;
        swap.status = Status.Open;
        swap.ask = _ask;
        swap.lockDuration = _lockDuration;

        // Add the swap to the array
        swaps.push(swap);
        
        // Get the current swapId
        uint256 swapId = getSwapId();

        // And reflect the created swap id in the user's account
        swapIds[msg.sender].push(swapId);

        emit SwapOpened(swapId);
    }

    /// Called by seller to update the _ask on the swap with _swapId
    function setAsk(uint256 _swapId, uint256 _ask) external {
        Swap storage swap = _getSwap(_swapId);
    
        _requireIsOpen(swap.status);
        _requireIsSeller(msg.sender, swap.seller.party);

        swap.ask = _ask;
        emit AskSet(_swapId);
    }
    
    /// Called by seller to permanently close/cancel the swap with _swapId
    function closeSwap(uint256 _swapId) external {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.status);
        _requireIsSeller(msg.sender, swap.seller.party);

        swap.status = Status.Closed;
        emit SwapClosed(_swapId);
    }

    /// Make a new bid of _amount on an open swap with _swapId
    function makeBid(uint256 _swapId, uint256 _amount) external onlyAboveZero(_amount) {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.status);
        _requireIsNotSeller(msg.sender, swap.seller.party);
        require(!hasBidOnSwap[msg.sender][_swapId], "YieldSwap: caller has already bid");
        _requireValidBalanceAndAllowance(swap.buyer.token, msg.sender, _amount);

        // Make a new bid
        Bid memory bid;
        bid.bidder = msg.sender;
        bid.swapId = _swapId;
        bid.amount = _amount;

        // Add it to the contract's bids array
        bids.push(bid);

        // Get the bid id
        uint256 bidId = getBidId();

        // And reflect the new bid on the swap
        swap.bidIds.push(bidId);

        // And reflect the new bid in the buyer's list of bids
        bidIds[msg.sender].push(bidId);

        // Reflect that the user has bid on this swap
        hasBidOnSwap[msg.sender][_swapId] = true;
        bidderSwapIds[msg.sender].push(_swapId);

        emit BidMade(bidId);
    }

    /// Called by the bidder who has made bid with _bidId to set the _amount
    function setBid(uint256 _bidId, uint256 _amount) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
   
        _requireIsOpen(swap.status);
        require(msg.sender == bid.bidder, "YieldSwap: caller is not bidder");
        _requireValidBalanceAndAllowance(swap.buyer.token, msg.sender, _amount);

        bid.amount = _amount;

        emit BidSet(_bidId);
    }

    /// Called by the seller to accept the bid with _bidId and close the swap
    function acceptBid(uint256 _bidId) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
    
        _requireIsSeller(msg.sender, swap.seller.party);
        _accept(swap, bid.bidder, bid.swapId, bid.amount);

        emit BidAccepted(_bidId);
    }

    /// Called by a buyer to accept the ask and close the swap with _swapId
    function acceptAsk(uint256 _swapId) external {
        Swap storage swap = _getSwap(_swapId);
    
        _requireIsNotSeller(msg.sender, swap.seller.party);
        _accept(swap, msg.sender, _swapId, swap.ask);

        emit AskAccepted(_swapId);
    } 

    /// Called after the lock duration has elapsed on swap with _swapId to unstake any
    /// staked liquidity tokens, return them to the original party, and withdraw any
    /// yield to the counterparty
    function withdraw(uint256 _swapId) external {
        Swap storage swap = _getSwap(_swapId);
    
        _requireSwapIsClosed(swap.status);
        require(swap.buyer.party != address(0), "YieldSwap: swap was canceled");
        require(block.timestamp >= swap.lockUntilTimestamp, "YieldSwap: swap is locked");

        // Prevent further withdrawals
        swap.status = Status.Withdrawn; 

        // Only unstake if the token is an lp token
        if (swap.seller.isLp) {
            _unstake(swap.seller, swap.buyer.party, _swapId);
        }
        if (swap.buyer.isLp) {
            _unstake(swap.buyer, swap.seller.party, _swapId);
        }

        emit Withdrawn(_swapId);
    }

    /// Return the array of swapIds made by _address
    function getSwapIds(address _address) external view returns (uint[] memory) {
        return swapIds[_address];
    }

    /// Return the array of bidIds made by _address
    function getBidIds(address _address) external view returns (uint[] memory) {
        return bidIds[_address];
    }

    /// Return the swap associated with _swapId
    function getSwap(uint256 _swapId) external view returns (Swap memory) {
        return _getSwap(_swapId);
    }

    /// Return the bid associated with _bidId
    function getBid(uint256 _bidId) external view returns (Bid memory) {
        return _getBid(_bidId);
    }

    /// Return the array of all opened swaps
    function getSwaps() external view returns (Swap[] memory) {
        return swaps;
    }

    /// Return the array of all opened bids
    function getBids() external view returns (Bid[] memory) {
        return bids;
    }

    /// Return the array of all swapIds bid on by _address
    function getBidderSwapIds(address _address) 
        external 
        view 
        onlyValidAddress(_address) 
        returns (uint[] memory _bidderSwapIds) 
    {
        _bidderSwapIds = bidderSwapIds[_address];
    }

    /// Called by the owner to set the minimum lock duration
    function setMinLockDuration(uint256 _MIN_LOCK_DURATION) external onlyOwner {
        require(
            _MIN_LOCK_DURATION < MAX_LOCK_DURATION, 
            "YieldSwap: invalid min lock duration"
        );
        MIN_LOCK_DURATION = _MIN_LOCK_DURATION;
        emit MinLockDurationSet(_MIN_LOCK_DURATION);
    }

    /// Called by the owner to set the maximum lock duration
    function setMaxLockDuration(uint256 _MAX_LOCK_DURATION) external onlyOwner {
        require(
            MIN_LOCK_DURATION < _MAX_LOCK_DURATION, 
            "YieldSwap: invalid max lock duration"
        );
        MAX_LOCK_DURATION = _MAX_LOCK_DURATION;
        emit MaxLockDurationSet(_MAX_LOCK_DURATION);
    }

    /// Get the current swap id such that 
    /// for swapId i in range[0, swaps.length) i indexes a Swap in swaps
    function getSwapId() public view returns (uint) {
        require(swaps.length > 0, "YieldSwap: no swap opened");
        return swaps.length - 1;
    }

    /// Get the current bid id such that 
    /// for bid id i in range[0, bids.length) i indexes a Bid in bids 
    function getBidId() public view returns (uint) {
        require(bids.length > 0, "YieldSwap: no bid made");
        return bids.length - 1;
    }

    // Called internally to accept a bid or ask on the swap, perform the necessary
    // checks, mark the _buyer and the _amount they're paying for the swap, and
    // transfer any funds from party to counterparty
    function _accept(
        Swap storage swap,          // swap being accepted and closed
        address _buyer,             // buyer of the swap
        uint256 _swapId,            // id of swap being accepted and closed
        uint256 _amount             // amount paid by buyer in toSellerToken to seller for yield
    ) private {
        _requireIsOpen(swap.status);

        swap.status = Status.Closed;
        swap.buyer.party = _buyer;
        swap.buyer.amount = _amount;
        swap.lockUntilTimestamp = block.timestamp + swap.lockDuration;
       
        _transferOrStake(swap.seller, swap.buyer.party, _swapId);
        _transferOrStake(swap.buyer, swap.seller.party, _swapId);
    }

    // Called internally to handle whether to transfer the _party's funds directly
    // to the _counterparty or whether to stake the funds with the chef. When staking,
    // uses _swapId to uniquely identify the chef's deposit bucket.
    function _transferOrStake(
        Party memory _party, 
        address _counterparty, 
        uint256 _swapId
    ) private {
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

            // Get the poolId for this token 
            // (already confirmed that pool exists when opening swap)
            uint256 poolId = chef.getPoolId(address(token));

            // Deposit amount of token in the pool identified by the _swapId
            chef.bucketDeposit(_swapId, poolId, amount);
        } else { 
            // Otherwise, transfer the amount directly from the party to the counterparty
            // (minus the treasury fee)
            (uint256 treasuryAmount, uint256 counterpartyAmount) = getTreasuryFeeSplit(amount);
            token.transferFrom(party, _counterparty, counterpartyAmount);
            token.transferFrom(party, treasury, treasuryAmount);
        }
    }

    // Handle unstaking _party's token from chef bucket with _swapId, returning amount to 
    // party, and distributing accrued yield to _counterparty.
    function _unstake(
        Party memory _party, 
        address _counterparty, 
        uint256 _swapId
    ) private {
        IERC20 token = _party.token;
        address party = _party.party;
        uint256 amount = _party.amount;
   
        uint256 poolId = chef.getPoolId(address(token));

        // Unstake and return the lp token to the party
        chef.bucketWithdrawAmountTo(party, _swapId, poolId, amount);
    
        // And send the yield to the _counterparty (minus the treasury fee)
        uint256 yield = chef.getBucketYield(_swapId, poolId);
        (uint256 treasuryAmount, uint256 counterpartyAmount) = getTreasuryFeeSplit(yield);
        chef.bucketWithdrawYieldTo(_counterparty, _swapId, poolId, counterpartyAmount);
        chef.bucketWithdrawYieldTo(treasury, _swapId, poolId, treasuryAmount);
    }

    // Return the swap associated with _swapId
    function _getSwap(uint256 _swapId) 
        private 
        view 
        onlyValidSwapId(_swapId) 
        returns (Swap storage) 
    {
        return swaps[_swapId];
    }
    
    // Return the bid associated with _bidId
    function _getBid(uint256 _bidId) 
        private 
        view 
        onlyValidBidId(_bidId) 
        returns (Bid storage) 
    {
        return bids[_bidId];
    }

    // Require that the _lpToken is valid - that it's been added to the chef's pool
    // and that, if it's a helixToken, it's not marked to be staked
    function _requireValidLpToken(IERC20 _lpToken) private view {
        // Implicitly check that token has been added to pool
        uint256 poolId = chef.getPoolId(address(_lpToken));
        require(poolId != 0, "YieldSwap: no staking helix");
    }

    // Require that _address has amount of token in balance
    // and that _address has approved this contract to transfer amount
    function _requireValidBalanceAndAllowance(IERC20 token, address _address, uint256 amount) 
        private 
        view 
    {
        require(amount <= token.balanceOf(_address), "YieldSwap: insufficient balance");
        require(
            amount <= token.allowance(_address, address(this)),
            "YieldSwap: insufficient allowance"
        );
    }

    // Require that the swap's _status is open
    function _requireIsOpen(Status _status) private pure {
        require(_status == Status.Open, "YieldSwap: swap is closed");
    }

    // Require that the _caller is the _seller
    function _requireIsSeller(address _caller, address _seller) private pure {
        require(_caller == _seller, "YieldSwap: caller is not seller");
    }

    // Require that the _caller is not the seller
    function _requireIsNotSeller(address _caller, address _seller) private pure {
        require(_caller != _seller, "YieldSwap: caller is seller");
    }

    // Require that the swap's _status is closed
    function _requireSwapIsClosed(Status _status) private pure {
        string memory error = "YieldSwap: swap not closed";
        if (_status == Status.Open) {
            error = "YieldSwap: swap is open";
        } else if (_status == Status.Withdrawn) {
            error = "YieldSwap: swap is withdrawn";
        }
        require(_status == Status.Closed, error);
    }
}
