// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * P2P swap for sellers to sell the liquidity tokens. Sellers open a swap and set 
 * the amount of liquidity tokens to stake and the ask price. Buyers can accept the 
 * ask or make a bid. Bidding remains open until the seller accepts a bid or a buyer 
 * accepts the ask. When bidding is closed, the seller recieves the bid (or ask) 
 * amount and the buyer recieves the sell amount.
 */
contract LpSwap is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
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
    event OpenSwap(
        address indexed seller,
        uint256 indexed swapId,
        address toBuyerToken,
        address toSellerToken,
        uint256 amount,
        uint256 ask
    );

    // Emitted when a swap is closed with no buyer
    event CloseSwap(
        address indexed seller, 
        uint256 indexed swapId
    );

    // Emitted when a swap's ask is set by the seller
    event SetAsk(
        address indexed seller,
        uint256 indexed swapId,
        uint256 ask
    );

    // Emitted when a swap's ask is accepted by a buyer
    event AcceptAsk(
        address indexed buyer,
        address indexed seller,
        uint256 indexed swapId,
        uint256 ask
    );

    // Emitted when a bid is made on a swap by a bidder
    event MakeBid(
        address indexed bidder,
        uint256 indexed swapId,
        uint256 indexed bidId,
        uint256 amount
    );

    // Emitted when a bid amount is set by a bidder
    event SetBid(
        address indexed bidder, 
        uint256 indexed swapId,
        uint256 indexed bidId,
        uint256 amount
    );

    // Emitted when a swap's bid is accepted by the seller
    event AcceptBid(
        address indexed seller,
        address indexed buyer,
        uint256 indexed swapId,
        uint256 bidId,
        uint256 amount
    );
    
    modifier isValidSwapId(uint256 _swapId) {
        require(swaps.length != 0, "LpSwap: no swap opened");
        require(_swapId < swaps.length, "LpSwap: invalid swap id");
        _;
    }

    modifier isValidBidId(uint256 _bidId) {
        require(bids.length != 0, "LpSwap: no bid made");
        require(_bidId < bids.length, "LpSwap: invalid bid id");
        _;
    }

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "LpSwap: zero address");
        _;
    }

    modifier isAboveZero(uint256 _number) {
        require(_number > 0, "LpSwap: not above zero");
        _;
    }

    /// Called externally to open a new swap
    function openSwap(
        IERC20 _toBuyerToken,       // Token being sold in this swap by seller to buyer
        IERC20 _toSellerToken,      // Token being sold in this swap by buyer to seller
        uint256 _amount,            // Amount of toBuyerToken to sell
        uint256 _ask                // Amount of toSellerToken seller is asking to sell toBuyerToken for
    ) 
        external 
        whenNotPaused
        isNotZeroAddress(address(_toBuyerToken))
        isNotZeroAddress(address(_toSellerToken))
        isAboveZero(_amount)
    {
        require(address(_toSellerToken) != address(_toBuyerToken), "LpSwap: tokens not distinct");
        _requireValidBalanceAndAllowance(_toBuyerToken, msg.sender, _amount);

        // Open the swap
        Swap memory swap;
        swap.toBuyerToken = _toBuyerToken;
        swap.toSellerToken = _toSellerToken;
        swap.seller = msg.sender;
        swap.amount = _amount;
        swap.ask = _ask;
        swap.isOpen = true;

        // Add it to the swaps array
        swaps.push(swap);

        uint256 _swapId = getSwapId();

        // Reflect the created swap id in the user's account
        swapIds[msg.sender].push(_swapId);

        emit OpenSwap(
            msg.sender,
            _swapId,
            address(_toBuyerToken),
            address(_toSellerToken),
            _amount,
            _ask
        );
    }
    
    /// Called by seller to update the swap's ask
    function setAsk(uint256 _swapId, uint256 _ask) external whenNotPaused {
        Swap storage swap = _getSwap(_swapId);
        
        _requireIsOpen(swap.isOpen);
        _requireIsSeller(msg.sender, swap.seller);

        swap.ask = _ask;
        emit SetAsk(msg.sender, _swapId, _ask);
    }

    /// Called by seller to close the swap and withdraw their toBuyerTokens
    function closeSwap(uint256 _swapId) external whenNotPaused {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.isOpen);
        _requireIsSeller(msg.sender, swap.seller);

        swap.isOpen = false;
        emit CloseSwap(msg.sender, _swapId);
    }

    /// Make a new bid on an open swap
    function makeBid(uint256 _swapId, uint256 _amount) external whenNotPaused isAboveZero(_amount) {
        Swap storage swap = _getSwap(_swapId);

        _requireIsOpen(swap.isOpen);
        _requireIsNotSeller(msg.sender, swap.seller);
        require(!hasBidOnSwap[msg.sender][_swapId], "LpSwap: caller has already bid");
        _requireValidBalanceAndAllowance(swap.toSellerToken, msg.sender, _amount);

        // Open the swap
        Bid memory bid;
        bid.bidder = msg.sender;
        bid.swapId = _swapId;
        bid.amount = _amount;

        // Add it to the bids array
        bids.push(bid);

        uint256 bidId = getBidId();

        // Reflect the new bid in the swap
        swap.bidIds.push(bidId);

        // Reflect the new bid in the buyer's list of bids
        bidIds[msg.sender].push(bidId);

        // Reflect that the user has bid on this swap
        hasBidOnSwap[msg.sender][_swapId] = true;
        bidderSwapIds[msg.sender].push(_swapId);
        
        emit MakeBid(
            msg.sender,
            _swapId,
            bidId,
            _amount
        );
    }

    /// Called externally by a bidder while bidding is open to set the amount being bid
    function setBid(uint256 _bidId, uint256 _amount) external whenNotPaused {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
    
        _requireIsOpen(swap.isOpen);
        require(msg.sender == bid.bidder, "LpSwap: caller is not bidder");
        _requireValidBalanceAndAllowance(swap.toSellerToken, msg.sender, _amount);

        bid.amount = _amount;

        emit SetBid(msg.sender, bid.swapId, _bidId, _amount);
    }

    /// Called externally by the seller to accept the bid and close the swap
    function acceptBid(uint256 _bidId) external whenNotPaused nonReentrant {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);

        _requireIsSeller(msg.sender, swap.seller);
        _accept(swap, msg.sender, bid.bidder, bid.amount);

        emit AcceptBid(msg.sender, bid.bidder, bid.swapId, _bidId, bid.amount);
    }

    /// Called by a buyer to accept the ask and close the swap
    function acceptAsk(uint256 _swapId) external whenNotPaused nonReentrant {
        Swap storage swap = _getSwap(_swapId);

        _requireIsNotSeller(msg.sender, swap.seller);
        _accept(swap, swap.seller, msg.sender, swap.ask);

        emit AcceptAsk(msg.sender, swap.seller, _swapId, swap.ask);
    } 

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Return the array of swapIds made by _address
    function getSwapIds(address _address) external view returns(uint[] memory) {
        return swapIds[_address];
    }

    /// Return the array of bidIds made by _address
    function getBidIds(address _address) external view returns(uint[] memory) {
        return bidIds[_address];
    }

    /// Return the array of all swapIds bid on by _address
    function getBidderSwapIds(address _address) 
        external 
        view 
        isNotZeroAddress(_address) 
        returns (uint[] memory _bidderSwapIds) 
    {
        _bidderSwapIds = bidderSwapIds[_address];
    }

    /// Return the array of all opened swaps
    function getSwaps() external view returns(Swap[] memory) {
        return swaps;
    }

    /// Return the Swap associated with the _swapId
    function getSwap(uint256 _swapId) external view returns(Swap memory) {
        return _getSwap(_swapId);
    }
    
    /// Return the Bid associated with the _bidId
    function getBid(uint256 _bidId) external view returns(Bid memory) {
        return _getBid(_bidId);
    }

    /// Get the current swap id such that 
    /// for swapId i in range[0, swaps.length) i indexes a Swap in swaps
    function getSwapId() public view returns(uint) {
        return swaps.length != 0 ? swaps.length - 1 : 0;
    }

    /// Get the current bid id such that 
    /// for bid id i in range[0, bids.length) i indexes a Bid in bids 
    function getBidId() public view returns(uint) {
        return bids.length != 0 ? bids.length - 1 : 0;
    }

    // Called internally to accept a bid or an ask, perform the
    // necessary checks, and transfer funds
    function _accept(
        Swap storage _swap,      // swap being accepted and closed
        address _seller,         // seller of the swap
        address _buyer,          // buyer of the swap
        uint256 _toSellerAmount     // amount being paid by buyer to seller
    ) private {
        _requireIsOpen(_swap.isOpen);

        // Verify that the buyer and seller can both cover the swap
        IERC20 toBuyerToken = _swap.toBuyerToken;
        _requireValidBalanceAndAllowance(toBuyerToken, _seller, _swap.amount);

        IERC20 toSellerToken = _swap.toSellerToken;
        _requireValidBalanceAndAllowance(toSellerToken, _buyer, _toSellerAmount);

        // Update the swap's status
        _swap.isOpen = false;
        _swap.buyer = _buyer;
        _swap.cost = _toSellerAmount;

        // Seller pays the buyer
        toBuyerToken.transferFrom(_seller, _buyer, _swap.amount);

        // Buyer pays the seller
        toSellerToken.transferFrom(_buyer, _seller, _toSellerAmount);
    }

    // Return the Bid associated with the _bidId
    function _getBid(uint256 _bidId) 
        private 
        view 
        isValidBidId(_bidId) 
        returns(Bid storage) 
    {
        return bids[_bidId];
    }

    // Return the Swap associated with the _swapId
    function _getSwap(uint256 _swapId) 
        private 
        view 
        isValidSwapId(_swapId) 
        returns(Swap storage) 
    {
        return swaps[_swapId];
    }

    // Verify that _address has amount of token in balance
    // and that _address has approved this contract to transfer amount
    function _requireValidBalanceAndAllowance(IERC20 _token, address _address, uint256 _amount) private view {
        require(_amount <= _token.balanceOf(_address), "LpSwap: insufficient balance");
        require(
            _amount <= _token.allowance(_address, address(this)),
            "LpSwap: insufficient allowance"
        );
    }

    // Require that _isOpen is true
    function _requireIsOpen(bool _isOpen) private pure {
        require(_isOpen, "LpSwap: swap is closed");
    }

    // Require that _caller is _seller
    function _requireIsSeller(address _caller, address _seller) private pure {
        require(_caller == _seller, "LpSwap: caller is not seller");
    }

    // Require that _caller is not _seller
    function _requireIsNotSeller(address _caller, address _seller) private pure {
        require(_caller != _seller, "LpSwap: caller is seller");
    }
}
