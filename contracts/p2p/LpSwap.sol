// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IMasterChef.sol';
import "../interfaces/IERC20.sol";
import '../libraries/SafeERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/*
 * P2P swap for sellers to sell the liquidity tokens. Sellers open a swap and set 
 * the amount of liquidity tokens to stake and the ask price. Buyers can accept the 
 * ask or make a bid. Bidding remains open until the seller accepts a bid or a buyer 
 * accepts the ask. When bidding is closed, the seller recieves the bid (or ask) 
 * amount and the buyer recieves the sell amount.
 */
contract LpSwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
        
    struct Swap {
        IERC20 toBuyerToken;        // Token being sold in swap by seller to buyer
        IERC20 toSellerToken;       // Token being sold in swap by buyer to seller
        uint[] bidIds;              // Array of ids referencing bids made on this swap 
        address seller;             // Address that opened this swap and that is selling amount of toBuyerToken
        address buyer;              // Address of the buyer of this swap, set only after the swap is closed
        uint amount;                // Amount of toBuyerToken being sold in this swap
        uint ask;                   // Amount of toSellerToken seller is asking for in exchange for amount of toBuyerToken
        bool isOpen;                // True if bids or ask are being accepted and false otherwise
    }

    struct Bid {
        address bidder;             // Address making this bid
        uint swapId;                // Id of the swap this bid was made on
        uint amount;                // Amount of toSellerToken bidder is offering in exchange for amount of toBuyerToken and yield
        bool isOpen;                // True if the bid can be accepted and false otherwise
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

    modifier isValidSwapId(uint id) {
        require(swaps.length != 0, "LpSwap: NO SWAP OPENED");
        require(id < swaps.length, "LpSwap: INVALID SWAP ID");
        _;
    }

    modifier isValidBidId(uint id) {
        require(bids.length != 0, "LpSwap: NO BID MADE");
        require(id < bids.length, "LpSwap: INVALID BID ID");
        _;
    }

    constructor(
        address _treasury
    ) {
        treasury = _treasury;
        MAX_FEE_PERCENT = 1000;
    }

    // Called externally to open a new swap
    function openSwap(
        IERC20 toBuyerToken,    // Token being sold in this swap by seller to buyer
        IERC20 toSellerToken,   // Token being sold in this swap by buyer to seller
        uint amount,            // Amount of toBuyerToken to sell
        uint ask                // Amount of toSellerToken seller is asking to sell toBuyerToken for
    ) external {
        require(address(toBuyerToken) != address(0), "LpSwap: INVALID TO BUYER TOKEN ADDRESS");
        require(address(toSellerToken) != address(0), "LpSwap: INVALID TO SELLER TOKEN ADDRESS");
        require(address(toSellerToken) != address(toBuyerToken), "LpSwap: TOKENS MUST BE DISTINCT");
        require(amount > 0, "LpSwap: AMOUNT CAN'T BE ZERO");

        _verify(toBuyerToken, msg.sender, amount);

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

        uint _swapId = _getSwapId();

        // Reflect the created swap id in the user's account
        swapIds[msg.sender].push(_swapId);

        emit SwapOpened(_swapId);
    }

    // Called by seller to update the swap's ask
    function setAsk(uint _swapId, uint ask) external {
        Swap storage swap = _getSwap(_swapId);

        require(swap.isOpen, "LpSwap: SWAP IS CLOSED");
        require(msg.sender == swap.seller, "LpSwap: ONLY SELLER CAN SET ASK");

        swap.ask = ask;
        emit AskSet(_swapId);
    }
    
    // Called by seller to close the swap and withdraw their toBuyerTokens
    function closeSwap(uint _swapId) external {
        Swap storage swap = _getSwap(_swapId);

        require(swap.isOpen, "LpSwap: SWAP IS CLOSED");
        require(msg.sender == swap.seller, "LpSwap: ONLY SELLER CAN CLOSE SWAP");

        swap.isOpen = false;
        emit SwapClosed(_swapId);
    }

    // Make a new bid on an open swap
    function makeBid(uint _swapId, uint amount) external {
        Swap storage swap = _getSwap(_swapId);

        require(swap.isOpen, "LpSwap: SWAP IS CLOSED");
        require(msg.sender != swap.seller, "LpSwap: SELLER CAN'T BID ON THEIR OWN SWAP");
        require(!hasBidOnSwap[msg.sender][_swapId], "LpSwap: CALLER HAS ALREADY MADE BID");
        require(amount > 0, "LpSwap: BID AMOUNT CAN'T BE ZERO");
        _verify(swap.toSellerToken, msg.sender, amount);

        // Open the swap
        Bid memory bid;
        bid.bidder = msg.sender;
        bid.swapId = _swapId;
        bid.amount = amount;
        bid.isOpen = true;

        // Add it to the bids array
        bids.push(bid);

        uint bidId = _getBidId();

        // Reflect the new bid in the swap
        swap.bidIds.push(bidId);

        // Reflect the new bid in the buyer's list of bids
        bidIds[msg.sender].push(bidId);

        // Reflect that the user has bid on this swap
        hasBidOnSwap[msg.sender][_swapId] = true;

        emit BidMade(bidId);
    }

    // Called externally by a bidder while bidding is open to set the amount being bid
    function setBid(uint _bidId, uint amount) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);
    
        require(swap.isOpen, "LpSwap: SWAP IS CLOSED");
        require(msg.sender == bid.bidder, "LpSwap: CALLER IS NOT THE BIDDER");
        _verify(swap.toSellerToken, msg.sender, amount);

        bid.amount = amount;

        // Close or re-open the bid
        if (bid.amount == 0 && bid.isOpen) {
            bid.isOpen = false;
        } else if (bid.amount > 0 && !bid.isOpen) {
            bid.isOpen = true;
        }

        emit BidSet(_bidId);
    }

    // Called externally by the seller to accept the bid and close the swap
    function acceptBid(uint _bidId) external {
        Bid storage bid = _getBid(_bidId);
        Swap storage swap = _getSwap(bid.swapId);

        require(msg.sender == swap.seller, "LpSwap: ONLY SELLER CAN ACCEPT BID");
        require(bid.isOpen, "LpSwap: BID IS CLOSED");

        _accept(swap, msg.sender, bid.bidder, bid.amount);

        bid.isOpen = false;
        emit BidAccepted(_bidId);
    }

    // Called by a buyer to accept the ask and close the swap
    function acceptAsk(uint _swapId) external {
        Swap storage swap = _getSwap(_swapId);
        require(msg.sender != swap.seller, "LpSwap: SELLER CAN'T ACCEPT ASK");

        _accept(swap, swap.seller, msg.sender, swap.ask);

        emit AskAccepted(_swapId);
    } 

    // Called internally to accept a bid or an ask, perform the
    // necessary checks, and transfer funds
    function _accept(
        Swap storage swap,
        address seller,
        address buyer,
        uint toSellerAmount
    ) private {
        require(swap.isOpen, "LpSwap: SWAP IS CLOSED");

        // Verify that the buyer and seller can both cover the swap
        IERC20 toBuyerToken = swap.toBuyerToken;
        _verify(toBuyerToken, seller, swap.amount);

        IERC20 toSellerToken = swap.toSellerToken;
        _verify(toSellerToken, buyer, toSellerAmount);

        // Update the swap's status
        swap.isOpen = false;
        swap.buyer = buyer;

        // Seller pays the buyer and pays their swap fees
        (uint buyerAmount, uint buyerTreasuryFee) = _applySellerFee(swap.amount);
        toBuyerToken.safeTransferFrom(seller, buyer, buyerAmount);
        toBuyerToken.safeTransferFrom(seller, treasury, buyerTreasuryFee);

        // Buyer pays the seller and pays their swap fees
        (uint sellerAmount, uint sellerTreasuryFee) = _applyBuyerFee(toSellerAmount);
        toSellerToken.safeTransferFrom(buyer, seller, sellerAmount);
        toSellerToken.safeTransferFrom(buyer, treasury, sellerTreasuryFee);
    }

    // Return the bid with the highest bid amount made on _swapId
    // If there are tied highest bids, choose the one that was made first
    function getMaxBid(uint _swapId) external view returns(Bid memory maxBid) {
        Swap storage swap = _getSwap(_swapId);
        uint[] memory _bidIds = swap.bidIds;

        for (uint id = 0; id < _bidIds.length; id++) {
            if (bids[id].amount > maxBid.amount) {
                maxBid = bids[id];
            }
        }
    }
    
    // Verify that _address has amount of token in balance
    // and that _address has approved this contract to transfer amount
    function _verify(IERC20 token, address _address, uint amount) private view {
        require(amount <= token.balanceOf(_address), "LpSwap: INSUFFICIENT TOKEN BALANCE");
        require(
            amount <= token.allowance(_address, address(this)),
            "LpSwap: INSUFFICIENT TOKEN ALLOWANCE"
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

    function setTreasury(address _treasury) external onlyOwner {
        require(address(_treasury) != address(0), "LpSwap: INVALID TREASURY ADDRESS");
        treasury = _treasury;
    }

    function setSellerFee(uint _sellerFee) external onlyOwner {
        require(_sellerFee <= MAX_FEE_PERCENT, "LpSwap: INVALID SELLER FEE");
        sellerFee = _sellerFee;
    }

    function setBuyerFee(uint _buyerFee) external onlyOwner {
        require(_buyerFee <= MAX_FEE_PERCENT, "LpSwap: INVALID BUYER FEE");
        buyerFee = _buyerFee;
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
}
