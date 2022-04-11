// SPDX-License-Identifer: MIT
pragma solidity >= 0.8.0;

import '../interfaces/IERC20.sol';
import '../libraries/SafeERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/*
 * P2P auction for sellers to sell liquidity tokens and their yield after being locked
 * for a duration. Sellers open an auction and set the amount of liquidity tokens to
 * sell, the minimum bid, the starting ask, the duration of bidding on the auction, and 
 * the duration liquidity tokens are locked after bidding has closed. Buyers can accept
 * the ask or make a bid. If no bid or ask has been accepted before bidding ends the 
 * highest bidder is selected. When bidding ends the seller recieves the highest bid 
 * and the liquidity tokens are locked until the lock duration expires, after which 
 * the buyer can withdraw their liquidity tokens plus their earned yield. 
 */
contract YieldAndUnderlyingSwap {
    using SafeERC20 for IERC20;

    // Liquidity token held and earning yield by seller to be recieved by buyer after duration
    IERC20 public lpToken;
    
    // Token exchanged by buyer to seller for lpToken
    IERC20 public exToken;

    // Information about an opened auction
    struct Auction {
        address seller;             // Address that opened this auction and that is selling amount of lpToken
        address buyer;              // Address with the current highest bid
        uint amount;                // Amount of lpToken being sold in this auction
        uint ask;                   // Amount of exToken seller is asking for in exchange for amount of lpToken and yield
        uint bid;                   // Amount of exToken buyer is offering in exchange for amount of lpToken and yield
        uint numBids;               // The number of bids that have been made on this auction
        uint openUntilTimestamp;    // Timestamp after which new bids or ask accepts are automatically rejected and a buyer is accepted
        uint lockUntilTimestamp;    // Timestamp after which the buyer can withdraw their purchase of lpToken and yield
        uint lockDuration;          // Duration between openUntilTimestamp and lockUntilTimestam
        bool isOpen;                // True if (openUntilTimestamp has not passed and a bid has not been accepted) and false otherwise
        bool isWithdrawn;           // True if the purchase has been withdrawn and false otherwise
    }

    // Current maximum auction id and the number of auctions opened
    uint public auctionId;

    // Array of all opened auctions
    Auction[] public auctions;

    // Maximum duration in seconds that an auction can be open for bidding, 86400 == 1 day
    uint public MAX_OPEN_DURATION;

    // Maximum duration in seconds that an auction can be locked before allowing withdrawal, 86400 == 1 day
    uint public MAX_LOCK_DURATION;

    // Map a seller address to the auctions it's opened 
    mapping(address => uint[]) public auctionIds;

    // Map a buyer address to the auctions it's bid on
    mapping(address => uint[]) public bidIds;

    // Emitted when a new auction is opened 
    event Opened(uint indexed id);

    // Emitted when an auction ends by reaching the openUntilTimestamp
    event Closed(uint indexed id);

    // Emitted when an auction's ask is set by the seller
    event AskSet(uint indexed id);

    // Emitted when an auction's ask is accepted by a buyer
    event AskAccepted(uint indexed id);

    // Emitted when a bid is made on an auction by a buyer
    event BidMade(uint indexed id);

    // Emitted when an auction's highest bid is accepted by the seller
    event BidAccepted(uint indexed id);

    // Emitted when an auction's buyer withdraws their funds after lockUntilTimestamp
    event Withdrawn(uint indexed id);

    modifier isValidAddress(address _address) {
        require(_address != address(0), "YieldAndUnderlyingSwap: INVALID ADDRESS");
        _;
    }

    modifer isValidAuctionId(uint id) {
        require(id <= auctionId, "YieldAndUnderlyingSwap: INVALID AUCTION ID");
        _;
    }

    constructor(address _lpToken, address _exToken) 
        isValidAddress(_lpToken)
        isValidAddress(_exToken)
    {
        lpToken = IERC20(_lpToken);
        exToken = IERC20(_exToken);

        MAX_OPEN_DURATION = 30 days;
        MAX_LOCK_DURATION = 365 days;
    }

    // Called externally to open a new auction
    // `bid` sets the minimum, starting bid
    function open(uint amount, uint ask, uint bid, uint openDuration, uint lockDuration) external {
        require(amount > 0, "YieldAndUnderlyingSwap: INVALID AMOUNT");
        require(ask > 0, "YieldAndUnderlyingSwap: INVALID ASK");
        require(bid < ask, "YieldAndUnderlyingSwap: INVALID BID");
        require(0 < openDuration && openDuration < MAX_OPEN_DURATION, "YieldAndUnderlyingSwap: INVALID OPEN DURATION");
        require(0 < lockDuration && lockDuration < MAX_LOCK_DURATION, "YieldAndUnderlyingSwap: INVALID LOCK DURATION");
        require(amount <= lpToken.balanceOf(msg.sender), "INSUFFICIENT LP TOKEN BALANCE TO OPEN");
        require(
            amount <= lpToken.allowance(msg.sender, address(this)),
            "YieldAndUnderlyingSwap: INSUFFICIENT LP TOKEN ALLOWANCE TO OPEN"
        );

        // Lock the seller's funds while the auction is open
        lpToken.safeTransferFrom(msg.sender, address(this), amount);

        // Open the auction
        uint id = auctionId++;
        Auction storage auction = auctions[id];
        auction.amount = amount;
        auction.ask = ask;
        auction.openUntilTimestamp = block.timestamp + openDuration;
        auction.lockDuration = lockDuration;
        auction.isOpen = true;
        
        // Reflect the created auction id in the user's account
        auctionIds[msg.sender].push(id);

        emit Opened(id);
    }

    // Called by seller to update their auction's ask
    function setAsk(uint id, uint ask) external isValidAuctionId(id) {
        _close(id);

        Auction storage auction = auctions[id];
        if (!auction.isOpen) {
            return;
        }

        require(msg.sender == auction.seller, "YieldAndUnderlyingSwap: ONLY SELLER CAN SET ASK");
        require(ask > auction.bid, "YieldAndUnderlyingSwap: ASK MUST BE GREATER THAN BID");
        require(ask < auction.ask, "YieldAndUnderlyingSwap: ASK MUST BE LESS THAN PREVIOUS ASK");

        // set the ask
        auction.ask = ask;

        emit AskSet(id);
    }

    // Make a bid on an open auction
    function makeBid(uint id, uint bid) external isValidAuctionId(id) {
        _close(id);

        Auction storage auction = auctions[id];
        if (!auction.isOpen) {
            return;
        }

        require(msg.sender != auction.seller, "YieldAndUnderlyingSwap: SELLER CAN'T BID");
        require(bid > auction.bid, "YieldAndUnderlyingSwap: BID MUST BE GREATER THAN EXISTING BID");
        require(bid < auction.ask, "YieldAndUnderlyingSwap: BID MUST BE LESS THAN ASK");
        require(bid <= exToken.balanceOf(msg.sender), "INSUFFICIENT EXCHANGE TOKEN BALANCE TO BID");
        require(
            bid <= exToken.allowance(msg.sender, address(this)),
            "YieldAndUnderlyingSwap: INSUFFICIENT EXCHANGE TOKEN ALLOWANCE TO BID"
        );
   
        // Lock the buyer's funds while the auction is open
        exToken.safeTransferFrom(msg.sender, address(this), bid);

        // Return previous bid to previous highest bidder before updating
        exToken.safeTransfer(auction.buyer, auction.bid);

        // Set buyer as new highest bidder
        auction.buyer = msg.sender;
        auction.bid = bid;
        auction.numBids++;

        emit BidMade(id);
    }

    // Called externally by the seller to accept the highest bid and close the auction
    function acceptBid(uint id) external isValidAuctionId(id) {
        _close(id);

        Auction storage auction = auctions[id];
        if (!auction.isOpen) {
            return;
        }
        auction.isOpen = false;
        auction.lockUntilTimestamp = block.timestamp + auction.duration;

        require(msg.sender == auction.seller, "YieldAndUnderlyingSwap: ONLY SELLER CAN ACCEPT BID");
        require(auction.buyer != address(0), "YieldAndUnderlyingSwap: NO BID HAS BEEN MADE");

        // Send the seller their funds
        exToken.safeTransfer(msg.sender, auction.bid);

        emit BidAccepted(id);
    }

    // Called by a buyer to accept the ask and close the auction
    function acceptAsk(uint id) external isValidAuctionId(id) {
        _close(id);

        Auction storage auction = auctions[id];
        if (!auction.isOpen) {
            return;
        }
        auction.isOpen = false;
        auction.lockUntilTimestamp = block.timestamp + auction.duration;

        require(msg.sender != auction.seller, "YieldAndUnderlyingSwap: ONLY BUYER CAN ACCEPT ASK");
        require(auction.ask <= exToken.balanceOf(msg.sender), "INSUFFICIENT EXCHANGE TOKEN BALANCE TO ACCEPT ASK");
        require(
            auction.ask <= exToken.allowance(msg.sender, address(this)),
            "YieldAndUnderlyingSwap: INSUFFICIENT ALLOWANCE TO ACCEPT ASK");

        // send funds directly from buyer to seller
        exToken.safeTransferFrom(msg.sender, auction.seller, auction.ask);
        
        emit AskAccepted(id);
    } 

    // Called externally to update the auction state from open to closed
    function close(uint id) public isValidAuctionId(id) {
        _close(id);
    }

    // Called internally to close an auction if the openUntilTimestamp has passed
    function _close(uint id) private {
        Auction storage auction = auctions[id]; 

        if (auction.isOpen && block.timestamp > auction.openUntilTimestamp) {
            auction.isOpen = false;

            if (auction.bidder == address(0)) {
                // If no bids have been placed return the seller their deposited funds
                lpToken.safeTransfer(auction.seller, auction.amount);
            } else {
                // Otherwise, pay the seller the highest bid
                exToken.safeTransfer(auction.seller, auction.bid);

                // and start the lock duration
                auction.lockUntilTimestamp = block.timestamp + auction.duration;
            }

            emit Closed(id);
        }
    }

    // Called to send auction buyer their purchased lpTokens plus yield
    function withdraw(uint id) public isValidAuctionId(id) {
        Auction storage auction = auctions[id];

        require(!auction.isOpen, "YieldAndUnderlyingSwap: "AUCTION IS OPEN");
        require(!auction.isWithdrawn, "YieldAndUnderlyingSwap: "AUCTION HAS BEEN WITHDRAWN");
        require(auction.buyer != address(0), "YieldAndUnderlyingSwap: AUCTION HAD NO BUYER");
        require(block.timestamp > auction.lockUntilTimestamp, "YieldAndUnderlyingSwap: "WITHDRAW IS LOCKED");

        auction.isWithdrawn = true; 
        lpToken.safeTransfer(auction.buyer, auction.amount);

        emit Withdrawn(id);
    }
}
