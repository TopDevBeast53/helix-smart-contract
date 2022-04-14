// SPDX-License-Identifer: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IMasterChef.sol';
import "../interfaces/IERC20.sol";
import '../libraries/SafeERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/*
 * P2P swap for sellers to sell an amount of a token in exchange for a negotiated 
 * amount of another token. Sellers open a swap and set the amount of tokens to
 * sell, the token they're exchanging for, and the ask price. Buyers can accept the 
 * ask or make a bid. Bidding remains open until the seller accepts a bid or a buyer 
 * accepts the ask. When bidding is closed, the seller recieves the bid (or ask) 
 * amount of the exchange token and the buyer receives the selling token.  
 */
contract PrincipleSwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
        
    // Maximum duration in seconds that a swap can be locked before allowing withdrawal, 86400 == 1 day
    uint public MAX_LOCK_DURATION;

    struct Swap {
        IERC20 toBuyerToken;        // Token being sold to buyer by seller in the swap
        IERC20 toSellerToken;       // Token being sold to seller by buyer in the swap
        uint[] bidIds;              // Array of ids referencing bids made on this swap 
        address seller;             // Address that opened this swap and that is selling amount of toBuyerToken
        address buyer;              // Address of the buyer of this swap, set only after the swap is closed
        uint amount;                // Amount of toBuyerToken being staked in this swap
        uint ask;                   // Amount of toSellerToken seller is asking for in exchange for toBuyerToken yield
        bool isOpen;                // True if bids or ask are being accepted and false otherwise
        bool isWithdrawn;           // True if the purchase has been withdrawn by buyer and false otherwise
    }

    struct Bid {
        address bidder;             // Address making this bid
        uint swapId;                // Id of the swap this bid was made on
        uint amount;                // Amount of toSellerToken bidder is offering in exchange for amount of toBuyerToken and yield
    }

    // Current swap id, the number of swaps opened, 
    // and for swapId i where i in range(0, swapId], i indexes a Swap in swaps
    uint public swapId;

    // Current bid id, the number of bids made,
    // and for bidId i where i in range(0, bidId], i indexes a Bid in bids 
    uint public bidId;

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
    // and if fee == 50 that's 5% and if fee == 500 that's 50%
    uint public MAX_FEE_PERCENT;

    // Map a seller address to the swaps it's opened 
    mapping(address => uint[]) public swapIds;

    // Map a buyer address to the bids it's made
    mapping(address => uint[]) public bidIds;

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
        require(0 < id && id <= swapId, "PrincipleSwap: INVALID SWAP ID");
        _;
    }

    modifier isValidBidId(uint id) {
        require(0 < id && id <= bidId, "PrincipleSwap: INVALID BID ID");
        _;
    }

    constructor(address _treasury) {
        treasury = _treasury;
        MAX_FEE_PERCENT = 1000;
    }

    // Called externally to open a new swap
    function swapOpen(
        IERC20 toBuyerToken,    // Token being sold to buyer by seller
        IERC20 toSellerToken,   // Token being sold to seller by buyer
        uint amount,            // Amount of toBuyerToken to swap
        uint ask                // Amount of toSellerToken seller is asking to sell toBuyerToken for
    ) external {
        require(address(toBuyerToken) != address(0), "PrincipleSwap: INVALID TO BUYER TOKEN ADDRESS");
        require(address(toSellerToken) != address(0), "PrincipleSwap: INVALID TO SELLER TOKEN ADDRESS");
        require(address(toBuyerToken) != address(toSellerToken), "PrincipleSwap: TOKENS MUST BE DIFFERENT");
        require(amount > 0, "PrincipleSwap: AMOUNT CAN'T BE ZERO");

        _depositToken(toBuyerToken, amount);

        // Open the swap
        uint _swapId = ++swapId;
        Swap storage swap = swaps[_swapId];

        swap.toBuyerToken = toBuyerToken;
        swap.toSellerToken = toSellerToken;
        swap.amount = amount;
        swap.ask = ask;
        swap.isOpen = true;
        
        // Reflect the created swap id in the user's account
        swapIds[msg.sender].push(_swapId);

        emit SwapOpened(_swapId);
    }

    // Called by seller to update the swap's ask
    function setAsk(uint _swapId, uint ask) external isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(swap.isOpen, "PrincipleSwap: SWAP IS CLOSED");
        require(msg.sender == swap.seller, "PrincipleSwap: ONLY SELLER CAN SET ASK");

        swap.ask = ask;
        emit AskSet(_swapId);
    }
    
    // Called by seller to close the swap and withdraw their toBuyerTokens
    function swapClose(uint _swapId) external isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(swap.isOpen, "PrincipleSwap: SWAP IS CLOSED");
        require(msg.sender == swap.seller, "PrincipleSwap: ONLY SELLER CAN SET ASK");

        swap.isOpen = false;
        swap.toBuyerToken.transfer(msg.sender, swap.amount);

        emit SwapClosed(_swapId);
    }

    // Make a bid on an open swap
    function makeBid(uint _swapId, uint amount) external isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(swap.isOpen, "PrincipleSwap: SWAP IS CLOSED");
        require(msg.sender != swap.seller, "PrincipleSwap: SELLER CAN'T BID ON THEIR OWN SWAP");
        require(_getBidId(_swapId) == 0, "PrincipleSwap: CALLER HAS ALREADY BID");
        
        _depositToken(swap.toSellerToken, amount);

        // Open the bid
        uint _bidId = ++bidId;
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

    // Called externally by a buyer while bidding is open to set the amount being bid
    function setBid(uint _bidId, uint amount) external isValidBidId(bidId) {
        Bid storage bid = bids[_bidId];
        Swap storage swap = swaps[bid.swapId];
    
        require(swap.isOpen, "PrincipleSwap: SWAP IS CLOSED");
        require(msg.sender == bid.bidder, "PrincipleSwap: CALLER IS NOT THE BIDDER");

        if (amount > bid.amount) {
            uint amountToDeposit = amount - bid.amount;
            bid.amount += amountToDeposit;
            _depositToken(swap.toSellerToken, amountToDeposit);
        } else if (amount < bid.amount) {
            uint amountToWithdraw = bid.amount - amount;
            bid.amount -= amountToWithdraw;
            swap.toSellerToken.safeTransfer(msg.sender, amountToWithdraw);
        }

        emit BidSet(_bidId);
    }

    // Called externally by a bidder after bidding is closed to withdraw their bid
    function withdrawBid(uint _bidId) external isValidBidId(_bidId) {
        Bid storage bid = bids[_bidId];
        Swap storage swap = swaps[bid.swapId];

        require(!swap.isOpen, "PrincipleSwap: SWAP IS OPEN");
        require(msg.sender != swap.buyer, "PrincipleSwap: BUYER CAN'T WITHDRAW BID");
        require(msg.sender == bid.bidder, "PrincipleSwap: CALLER IS NOT BIDDER");
        require(bid.amount != 0, "PrincipleSwap: CALLER HAS NO BID");
   
        swap.toSellerToken.safeTransfer(msg.sender, bid.amount);
        bid.amount = 0;

        emit BidWithdrawn(_bidId);
    }

    // Called externally by the seller to accept the bid and close the swap
    function acceptBid(uint _bidId) external isValidBidId(_bidId) {
        Bid storage bid = bids[_bidId];
        Swap storage swap = swaps[bid.swapId];

        require(swap.isOpen, "PrincipleSwap: SWAP IS CLOSED");
        require(msg.sender == swap.seller, "PrincipleSwap: ONLY SELLER CAN ACCEPT BID");

        swap.isOpen = false;
        swap.buyer = bid.bidder;

        _sendSeller(swap.toSellerToken, msg.sender, bid.amount);
        _sendBuyer(swap.toBuyerToken, bid.bidder, swap.amount);

        emit BidAccepted(_bidId);
    }

    // Called by a buyer to accept the ask and close the swap
    function acceptAsk(uint _swapId) external isValidSwapId(_swapId) {
        Swap storage swap = swaps[_swapId];

        require(swap.isOpen, "PrincipleSwap: SWAP IS CLOSED");
        require(msg.sender != swap.seller, "PrincipleSwap: ONLY BUYER CAN ACCEPT ASK");
        require(swap.ask <= swap.toSellerToken.balanceOf(msg.sender), "INSUFFICIENT TO SELLER TOKEN BALANCE TO ACCEPT ASK");
        require(
            swap.ask <= swap.toSellerToken.allowance(msg.sender, address(this)),
            "PrincipleSwap: INSUFFICIENT TO SELLER TOKEN ALLOWANCE TO ACCEPT ASK"
        );

        swap.isOpen = false;
        swap.buyer = msg.sender;

        _sendSeller(swap.toSellerToken, swap.seller, swap.ask);
        _sendBuyer(swap.toBuyerToken, msg.sender, swap.amount);

        // If the buyer has made a bid, return the bid amount to them
        uint _bidId = _getBidId(_swapId);
        if (_bidId != 0) {
            uint bidAmount = bids[_bidId].amount; 
            swap.toBuyerToken.safeTransfer(swap.buyer, bidAmount); 
        }
 
        emit AskAccepted(_swapId);
    } 

    // Send the seller their funds minus the fee sent to the treasury
    function _sendSeller(IERC20 token, address seller, uint amount) private {
        (uint sellerAmount, uint treasuryAmount) = _applySellerFee(amount);
        token.safeTransfer(seller, sellerAmount); 
        token.safeTransfer(treasury, treasuryAmount); 
    }

    // Send the buyer their funds minus the fee sent to the treasury
    function _sendBuyer(IERC20 token, address buyer, uint amount) private {
        (uint buyerAmount, uint treasuryAmount) = _applyBuyerFee(amount);
        token.safeTransfer(buyer, buyerAmount); 
        token.safeTransfer(treasury, treasuryAmount); 
    }

    // Return the bid with the highest bid amount made on _swapId
    // If there are tied highest bids, choose the one that was made first
    function getMaxBid(uint _swapId) external view isValidSwapId(_swapId) returns(Bid memory maxBid) {
        Swap storage swap = swaps[_swapId];
        uint[] memory _bidIds = swap.bidIds;

        for (uint id = 1; id <= _bidIds.length; id++) {
            if (bids[id].amount > maxBid.amount) {
                maxBid = bids[id];
            }
        }
    }

    // Transfer amount of toBuyerToken from msg.sender and stake them in poolId
    function _depositToken(IERC20 token, uint amount) private {
        require(amount <= token.balanceOf(msg.sender), "INSUFFICIENT TOKEN BALANCE TO DEPOSIT");
        require(
            amount <= token.allowance(msg.sender, address(this)),
            "PrincipleSwap: INSUFFICIENT TO BUYER TOKEN TOKEN ALLOWANCE TO DEPOSIT"
        );

        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    // If msg.sender has made a bid on swapId return the bidId, otherwise return 0
    function _getBidId(uint _swapId) private view returns(uint) {
        uint[] memory _bidIds = bidIds[msg.sender];

        for (uint id = 0; id <= _bidIds.length; id++) {
            if (_swapId == bids[id].swapId) {
                return id;
            }
        }
        return 0;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(address(_treasury) != address(0), "PrincipleSwap: INVALID TREASURY ADDRESS");
        treasury = _treasury;
    }

    function setSellerFee(uint _sellerFee) external onlyOwner {
        require(_sellerFee <= MAX_FEE_PERCENT, "PrincipleSwap: INVALID SELLER FEE");
        sellerFee = _sellerFee;
    }

    function setBuyerFee(uint _buyerFee) external onlyOwner {
        require(_buyerFee <= MAX_FEE_PERCENT, "PrincipleSwap: INVALID BUYER FEE");
        buyerFee = _buyerFee;
    }

    // Apply the seller fee and get the amounts that go to the seller and to the treasury
    function _applySellerFee(uint amount) private view returns(uint sellerAmount, uint treasuryAmount) {
        treasuryAmount = amount * sellerFee / MAX_FEE_PERCENT;
        sellerAmount = amount - treasuryAmount;
    }

    // Apply the buyer fee and get the amounts that go to the buyer and to the treasury
    function _applyBuyerFee(uint amount) private view returns(uint buyerAmount, uint treasuryAmount) {
        treasuryAmount = amount * buyerFee / MAX_FEE_PERCENT;
        buyerAmount = amount - treasuryAmount;
    }
}
