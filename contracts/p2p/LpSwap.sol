// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../fees/FeeCollector.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * P2P swap for sellers to sell the liquidity tokens. Sellers open a swap and set 
 * the amount of liquidity tokens to stake and the ask price. Buyers can accept the 
 * ask or make a bid. Bidding remains open until the seller accepts a bid or a buyer 
 * accepts the ask. When bidding is closed, the seller recieves the bid (or ask) 
 * amount and the buyer recieves the sell amount.
 */
contract LpSwap is FeeCollector, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
        
    struct Swap {
        IERC20 toBuyerToken;        // Token being sold in swap by seller to buyer
        IERC20 toSellerToken;       // Token being sold in swap by buyer to seller
        uint[] bidIds;              // Array of ids referencing bids made on this swap 
        address seller;             // Address that opened this swap and that is selling amount of toBuyerToken
        address buyer;              // Address of the buyer of this swap, set only after the swap is closed
        uint256 amount;                // Amount of toBuyerToken being sold in this swap
        uint256 cost;                  // Cost (bid/ask) in toSellerToken paid to seller, set only after swap is closed
        uint256 ask;                   // Amount of toSellerToken seller is asking for in exchange for amount of toBuyerToken
        bool isOpen;                // True if bids or ask are being accepted and false otherwise
    }

    struct Bid {
        address bidder;             // Address making this bid
        uint256 swapId;                // Id of the swap this bid was made on
        uint256 amount;                // Amount of toSellerToken bidder is offering in exchange for amount of toBuyerToken and yield
    }

    /// Array of all swaps opened
    Swap[] public swaps;

    /// Array of all bids made
    Bid[] public bids;

    /// Map a seller address to the swaps it's opened 
    mapping(address => uint[]) public swapIds;

    /// Map a bidder address to the bids it's made
    mapping(address => uint[]) public bidIds;

    /// Used for cheap lookup for whether an address has bid on a Swap 
    /// True if the address has bid on the swapId and false otherwise
    mapping(address => mapping(uint256 => bool)) public hasBidOnSwap;

    /// Map a bidder address to the swapIds it's bid on
    mapping(address => uint[]) public bidderSwapIds;

    // Emitted when a new swap is opened 
    event SwapOpened(uint256 indexed id);

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
    
    modifier isValidSwapId(uint256 id) {
        require(swaps.length != 0, "LpSwap: no swap opened");
        require(id < swaps.length, "LpSwap: invalid swap id");
        _;
    }

    modifier isValidBidId(uint256 id) {
        require(bids.length != 0, "LpSwap: no bid made");
        require(id < bids.length, "LpSwap: invalid bid id");
        _;
    }

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "LpSwap: zero address");
        _;
    }

    modifier isAboveZero(uint256 number) {
        require(number > 0, "LpSwap: not above zero");
        _;
    }

    constructor(address _feeHandler) {
        _setFeeHandler(_feeHandler);
    }

    // Called externally to open a new swap
    function openSwap(
        IERC20 toBuyerToken,    // Token being sold in this swap by seller to buyer
        IERC20 toSellerToken,   // Token being sold in this swap by buyer to seller
        uint256 amount,            // Amount of toBuyerToken to sell
        uint256 ask                // Amount of toSellerToken seller is asking to sell toBuyerToken for
    ) 
        external 
        whenNotPaused
        isNotZeroAddress(address(toBuyerToken))
        isNotZeroAddress(address(toSellerToken))
        isAboveZero(amount)
    {
        require(address(toSellerToken) != address(toBuyerToken), "LpSwap: tokens not distinct");
        _requireValidBalanceAndAllowance(toBuyerToken, msg.sender, amount);

        // Open the swap
        Swap memory swap;
        swap.toBuyerToken = toBuyerToken;
        swap.toSellerToken = toSellerToken;
        swap.seller = msg.sender;
        swap.amount = amount;
        swap.ask = ask;
        swap.isOpen = true;

        // Add it to the swaps array
        swaps.push(swap);

        uint256 _swapId = _getSwapId();

        // Reflect the created swap id in the user's account
        swapIds[msg.sender].push(_swapId);

        emit SwapOpened(_swapId);
    }

    // Called by seller to update the swap's ask
    function setAsk(uint256 _swapId, uint256 ask) external whenNotPaused {
        Swap storage swap = _getSwap(_swapId);
        
        _requireIsOpen(swap.isOpen);
        _requireIsSeller(msg.sender, swap.seller);

        swap.ask = ask;
        emit AskSet(_swapId);
    }
    
    // Called by seller to close the swap and withdraw their toBuyerTokens
    function closeSwap(uint256 _swapId) external whenNotPaused {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.isOpen);
        _requireIsSeller(msg.sender, swap.seller);

        swap.isOpen = false;
        emit SwapClosed(_swapId);
    }

    // Make a new bid on an open swap
    function makeBid(uint256 _swapId, uint256 amount) external whenNotPaused isAboveZero(amount) {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.isOpen);
        _requireIsNotSeller(msg.sender, swap.seller);
        require(!hasBidOnSwap[msg.sender][_swapId], "LpSwap: caller has already bid");
        _requireValidBalanceAndAllowance(swap.toSellerToken, msg.sender, amount);

        // Open the swap
        Bid memory bid;
        bid.bidder = msg.sender;
        bid.swapId = _swapId;
        bid.amount = amount;

        // Add it to the bids array
        bids.push(bid);

        uint256 bidId = _getBidId();

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
    function setBid(uint256 _bidId, uint256 amount) external whenNotPaused {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
    
        _requireIsOpen(swap.isOpen);
        require(msg.sender == bid.bidder, "LpSwap: caller is not bidder");
        _requireValidBalanceAndAllowance(swap.toSellerToken, msg.sender, amount);

        bid.amount = amount;

        emit BidSet(_bidId);
    }

    // Called externally by the seller to accept the bid and close the swap
    function acceptBid(uint256 _bidId) external whenNotPaused nonReentrant {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);

        _requireIsSeller(msg.sender, swap.seller);
        _accept(swap, msg.sender, bid.bidder, bid.amount);

        emit BidAccepted(_bidId);
    }

    // Called by a buyer to accept the ask and close the swap
    function acceptAsk(uint256 _swapId) external whenNotPaused nonReentrant {
        Swap storage swap = _getSwap(_swapId);

        _requireIsNotSeller(msg.sender, swap.seller);
        _accept(swap, swap.seller, msg.sender, swap.ask);

        emit AskAccepted(_swapId);
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

    // Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    // Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    // Called by the owner to set the _feeHandler address
    function setFeeHandler(address _feeHandler) external onlyOwner {
        _setFeeHandler(_feeHandler);
    }

    // Called by the owner to set the _collectorPercent
    function setCollectorPercent(uint256 _collectorPercent) external onlyOwner {
        _setCollectorPercent(_collectorPercent);
    }

    function _getSwapId() private view returns(uint) {
        if (swaps.length != 0) {
            return swaps.length - 1;
        } else {
            return 0;
        }
    }

    // Return the array of all swapIds bid on by _address
    function getBidderSwapIds(address _address) 
        external 
        view 
        isNotZeroAddress(_address) 
        returns (uint[] memory _bidderSwapIds) 
    {
        _bidderSwapIds = bidderSwapIds[_address];
    }

    // Return the array of all opened swaps
    function getSwaps() external view returns(Swap[] memory) {
        return swaps;
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
    
    // Return the bid associated with the given bidId
    function getBid(uint256 _bidId) external view returns(Bid memory) {
        return _getBid(_bidId);
    }

    // Called internally to accept a bid or an ask, perform the
    // necessary checks, and transfer funds
    function _accept(
        Swap storage swap,      // swap being accepted and closed
        address seller,         // seller of the swap
        address buyer,          // buyer of the swap
        uint256 toSellerAmount     // amount being paid by buyer to seller
    ) private {
        _requireIsOpen(swap.isOpen);

        // Verify that the buyer and seller can both cover the swap
        IERC20 toBuyerToken = swap.toBuyerToken;
        _requireValidBalanceAndAllowance(toBuyerToken, seller, swap.amount);

        IERC20 toSellerToken = swap.toSellerToken;
        _requireValidBalanceAndAllowance(toSellerToken, buyer, toSellerAmount);

        // Update the swap's status
        swap.isOpen = false;
        swap.buyer = buyer;
        swap.cost = toSellerAmount;

        // Seller pays the buyer the amount minus the swap fees
        (uint256 buyerCollectorFee, uint256 buyerAmount) = getCollectorFeeSplit(swap.amount);
        toBuyerToken.safeTransferFrom(seller, buyer, buyerAmount);
        _delegateTransfer(toBuyerToken, seller, buyerCollectorFee);

        // Buyer pays the seller the amount minus the swap fees
        (uint256 sellerCollectorFee, uint256 sellerAmount) = getCollectorFeeSplit(toSellerAmount);
        toSellerToken.safeTransferFrom(buyer, seller, sellerAmount);
        _delegateTransfer(toSellerToken, buyer, sellerCollectorFee);
    }

    // Verify that _address has amount of token in balance
    // and that _address has approved this contract to transfer amount
    function _requireValidBalanceAndAllowance(IERC20 token, address _address, uint256 amount) private view {
        require(amount <= token.balanceOf(_address), "LpSwap: insufficient balance");
        require(
            amount <= token.allowance(_address, address(this)),
            "LpSwap: insufficient allowance"
        );
    }

    function _getBid(uint256 _bidId) 
        private 
        view 
        isValidBidId(_bidId) 
        returns(Bid storage) 
    {
        return bids[_bidId];
    }

    function _getSwap(uint256 _swapId) 
        private 
        view 
        isValidSwapId(_swapId) 
        returns(Swap storage) 
    {
        return swaps[_swapId];
    }

    function _requireIsOpen(bool isOpen) private pure {
        require(isOpen, "LpSwap: swap is closed");
    }

    function _requireIsSeller(address caller, address seller) private pure {
        require(caller == seller, "LpSwap: caller is not seller");
    }

    function _requireIsNotSeller(address caller, address seller) private pure {
        require(caller != seller, "LpSwap: caller is seller");
    }
}
