// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../libraries/AuraLibrary.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IAuraNFT.sol";
import "../interfaces/IAuraToken.sol";
import "../swaps/AuraFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@rari-capital/solmate/src/utils/ReentrancyGuard.sol';
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// TODO - Add NatSpec comments to latter functions.

/**
 * @title Convert between Swap Reward Fees to Aura Points (ap/AP)
 */
contract SwapFeeRewardsWithAP is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet whitelist;

    IOracle public oracle;
    IAuraNFT public auraNFT;
    IAuraToken public auraToken;

    address public factory;
    address public router;
    address public market;
    address public auction;
    address public targetToken;
    address public targetAPToken;

    uint public maxMiningAmount = 100000000 ether;
    uint public maxMiningInPhase = 5000 ether;
    uint public maxAccruedAPInPhase = 5000 ether;

    uint public phase = 1;
    uint public phaseAP = 1; 
    
    uint public totalMined = 0;
    uint public totalAccruedAP = 0;

    uint public apWagerOnSwap = 1500;
    uint public apPercentMarket = 10000; // (div 10000)
    uint public apPercentAuction = 10000; // (div 10000)

    /*
     * Sets the upper limit of maximum AURA percentage of users' rewards.
     * Higher value -> higher max AURA percentage and more user choice.
     * 0   -> Rewards are [0]% AURA and [100]% AP. User has no choice.
     * 50  -> Rewards are [0, 50]% AURA and [0, 100]% AP. User has some choice.
     * 100 -> Rewards are [0, 100]% AURA and [0, 100]% AP. User has full choice.
     * Invariant: must be in range [0, 100].
     */
    uint public defaultRewardDistribution = 100; 

    struct PairsList {
        address pair;
        uint percentReward;
        bool isEnabled;
    }

    PairsList[] public pairsList;

    /* 
     * Fee distribution is a user setting for how that user wants their rewards distributed.
     * Assuming defaultRewardDistribution == 100, then:
     * 0   -> Rewards are distributed entirely in AURA.
     * 50  -> Rewards are 50% AURA and 50% AP.
     * 100 -> Rewards are distributed entirely in AP.
     * More generally, low values maximize AURA while high values maximize AP.
     * Invariant: rewardDistribution[user] <= defaultRewardDistribution.
     */
    mapping(address => uint) public rewardDistribution;

    mapping(address => uint) public pairOfPairIds;
    mapping(address => uint) public _balances;
    mapping(address => uint) public nonces;

    event NewAuraNFT(IAuraNFT auraNFT);
    event NewOracle(IOracle oracle);

    event Rewarded(address account, address input, address output, uint amount, uint quantity);
    event Withdraw(address user, uint amount);

    event NewPhase(uint phase);
    event NewPhaseAP(uint phaseAP);
    event NewRouter(address router);
    event NewMarket(address market);
    event NewAuction(address auction);
    event NewFactory(address factory);

    constructor(
        address _factory,
        address _router, 
        address _targetToken,
        address _targetAPToken,
        IOracle _oracle,
        IAuraNFT _auraNFT,
        IAuraToken _auraToken
    ) {
        require(
            _factory != address(0)
            && _router != address(0)
            && _targetToken != address(0)
            && _targetAPToken != address(0),
            "Address cannot be zero."
        );
        factory = _factory;
        router = _router;
        targetToken = _targetToken;
        targetAPToken = _targetAPToken;
        oracle = _oracle;
        auraNFT = _auraNFT;
        auraToken = _auraToken;
    }

    /* 
     * EXTERNAL CORE 
     *
     * These functions constitute this contract's core functionality. 
     */

    /**
     * @dev swap the `input` token for the `output` token and credit the result to `account`.
     */
    function swap(address account, address input, address output, uint amount) external returns(bool) {
        require (msg.sender == router, "Caller is not the router.");

        if (!whitelistContains(input) || !whitelistContains(output)) { return false; }

        address pair = createPair(input, output);
        PairsList memory pool = pairsList[pairOfPairIds[pair]];
        if (!pool.isEnabled || pool.pair != pair) { return false; }

        uint swapFee = AuraLibrary.getSwapFee(factory, input, output);
        (uint feeAmount, uint apAmount) = getSplitRewardAmounts(amount, account);
        feeAmount = feeAmount / swapFee;

        // Gets the quantity of AURA (targetToken) equivalent in value to quantity (feeAmount) of the input token (output).
        uint quantity = getQuantityOut(output, feeAmount, targetToken);
        if ((totalMined + quantity) <= maxMiningAmount && (totalMined + quantity) <= (phase * maxMiningInPhase)) {
            _balances[account] += quantity;
            emit Rewarded(account, input, output, amount, quantity);
        }

        apAmount = apAmount / apWagerOnSwap;
        _accrueAP(account, output, apAmount);

        return true;
    }

    /**
     * @dev Withdraw AURA from the caller's contract balance to the caller's address.
     */
    function withdraw(uint8 v, bytes32 r, bytes32 s) external nonReentrant returns(bool) {
        require (totalMined < maxMiningAmount, "All tokens have been mined.");

        uint balance = _balances[msg.sender];
        require ((totalMined + balance) <= (phase * maxMiningInPhase), "All tokens in this phase have been mined.");
      
        // Verify the sender's signature.
        permit(msg.sender, balance, v, r, s);

        if (balance > 0) {
            _balances[msg.sender] -= balance;
            totalMined += balance;
            if (auraToken.transfer(msg.sender, balance)) {
                emit Withdraw(msg.sender, balance);
                return true;
            }
        }
        return false;
    }

    /* 
     * PUBLIC UTILS 
     * 
     * These utility functions are used within this contract but are useful and safe enough 
     * to expose to callers as well. 
     */

    /**
     * @dev Gets the quantity of `tokenOut` equivalent in value to `quantityIn` many `tokenIn`.
     */
    function getQuantityOut(address tokenIn, uint quantityIn, address tokenOut) public view returns(uint quantityOut) {
        if (tokenIn == tokenOut) {
            // If the tokenIn is the same as the tokenOut, then there's no exchange quantity to compute.
            // I.e. ETH -> ETH.
            quantityOut = quantityIn;
        } else if (AuraFactory(factory).getPair(tokenIn, tokenOut) != address(0) 
            && pairExists(tokenIn, tokenOut)) 
        {
            // If a direct exchange pair exists, then get the exchange quantity directly.
            // I.e. ETH -> BTC where a ETH -> BTC pair exists.
            quantityOut = IOracle(oracle).consult(tokenIn, quantityIn, tokenOut);
        } else {
            // Otherwise, try to find an intermediate exchange token
            // and compute the exchange quantity via that intermediate token.
            // I.e. ETH -> BTC where ETH -> BTC doesn't exist but ETH -> SOL -> BTC does.
            uint length = whitelistLength();
            for (uint i = 0; i < length; i++) {
                address intermediate = whitelistGet(i);
                if (AuraFactory(factory).getPair(tokenIn, intermediate) != address(0)
                    && AuraFactory(factory).getPair(intermediate, tokenOut) != address(0)
                    && pairExists(intermediate, tokenOut))
                {
                    uint interQuantity = IOracle(oracle).consult(tokenIn, quantityIn, intermediate);
                    quantityOut = IOracle(oracle).consult(intermediate, interQuantity, tokenOut);
                    break;
                }
            }
        }
    }

    /**
     * @return _pairExists is true if this exchange swaps between tokens `a` and `b` and false otherwise.
     */
    function pairExists(address a, address b) public view returns(bool _pairExists) {
        address pair = createPair(a, b);
        uint pairId = pairOfPairIds[pair];
        // Prevent pairID index out of bounds.
        if (pairId >= pairsList.length) { return false; }
        PairsList memory pool = pairsList[pairId];
        _pairExists = (pool.pair == pair);
    }

    /**
     * @return pair created by joining tokens `a` and `b`.
     */
    function createPair(address a, address b) public view returns(address pair) {
        pair = AuraLibrary.pairFor(factory, a, b);
    }

    /* 
     * EXTERNAL GETTERS 
     * 
     * These functions provide useful information to callers about this contract's state. 
     */

    /**
     * @return the number of swap pairs recognized by the exchange.
     */
    function getPairsListLength() external view returns(uint) {
        return pairsList.length;
    }

    /**
     * @return the earned but unwithdrawn AURA in `account`.
     */
    function getBalance(address account) external view returns(uint) {
        return _balances[account];
    }

    /**
     * @dev Return to the caller the token quantities in AURA, USD, and AP
     *      that `account` could withdraw.
     */
    function getPotentialRewardQuantities(address account, address input, address output, uint amount) 
        external
        view
        returns(
            uint inAURA,
            uint inUSD,
            uint inAP
        )
    {
        uint swapFee = AuraLibrary.getSwapFee(factory, input, output); 
        address pair = createPair(input, output);
        PairsList memory pool = pairsList[pairOfPairIds[pair]];

        if (pool.pair == pair && pool.isEnabled && whitelistContains(input) && whitelistContains(output)) {
            (uint feeAmount, uint apAmount) = getSplitRewardAmounts(amount, account);
            inAURA = getQuantityOut(output, feeAmount / swapFee, targetToken) * pool.percentReward / 100;
            inUSD = getQuantityOut(output, apAmount / apWagerOnSwap, targetAPToken);
            inAP = getQuantityOut(targetToken, inAURA, targetAPToken);
        }
    }

    /* 
     * EXTERNAL SETTERS 
     * 
     * Provide callers with functionality for setting contract state.
     */

    function accrueAPFromMarket(address account, address fromToken, uint amount) external {
        require(msg.sender == market, "Caller is not the market.");
        amount = amount * apPercentMarket / 10000;
        _accrueAP(account, fromToken, amount);
    }

    function accrueAPFromAuction(address account, address fromToken, uint amount) external {
        require(msg.sender == auction, "Caller is not the auction.");
        amount = amount * apPercentAuction / 10000;
        _accrueAP(account, fromToken, amount);
    }

    function setRewardDistribution(uint _distribution) external {
        require(_distribution <= defaultRewardDistribution, "Invalid fee distribution.");
        rewardDistribution[msg.sender] = _distribution;
    }

    /* 
     * PRIVATE UTILS 
     * 
     * These functions are used within this contract but would be unsafe or useless
     * if exposed to callers.
     */

    /**
     * @dev verifies the spenders signature.
     */
    function permit(address spender, uint value, uint8 v, bytes32 r, bytes32 s) private {
        bytes32 message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(spender, value, nonces[spender]++))));
        address recoveredAddress = ecrecover(message, v, r, s);
        require(recoveredAddress != address(0) && recoveredAddress == spender, "Invalid signature.");
    }

    function _accrueAP(address account, address output, uint amount) private {
        uint quantity = getQuantityOut(output, amount, targetAPToken);
        if (quantity > 0) {
            totalAccruedAP += quantity;
            if (totalAccruedAP <= phaseAP * maxAccruedAPInPhase) {
                auraNFT.accrueAP(account, quantity);
            }
        }
    }

    /**
     * @return feeAmount due to the account.
     * @return apAmount due to the account.
     */
    function getSplitRewardAmounts(uint amount, address account) private view returns(uint feeAmount, uint apAmount) {
        feeAmount = amount * (defaultRewardDistribution - rewardDistribution[account]) / 100;
        apAmount = amount - feeAmount;
    }

    /* 
     * ONLY OWNER SETTERS 
     * 
     * These functions alter contract core data and are only available to the owner. 
     */

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Factory is the zero address.");
        factory = _factory;
        emit NewFactory(_factory);
    }

    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Router is the zero address.");
        router = _router;
        emit NewRouter(_router);
    }

    function setMarket(address _market) external onlyOwner {
        require(_market != address(0), "Market is the zero address.");
        market = _market;
        emit NewMarket(_market);
    }

    function setAuction(address _auction) external onlyOwner {
        require(_auction!= address(0), "Auction is the zero address.");
        auction = _auction;
        emit NewAuction(_auction);
    }

    function setPhase(uint _phase) external onlyOwner {
        phase = _phase;
        emit NewPhase(_phase);
    }

    function setPhaseAP(uint _phaseAP) external onlyOwner {
        phaseAP = _phaseAP;
        emit NewPhaseAP(_phaseAP);
    }

    function setOracle(IOracle _oracle) external onlyOwner {
        require(address(_oracle) != address(0), "Oracle is the zero address.");
        oracle = _oracle;
        emit NewOracle(_oracle);
    }

    function setAuraNFT(IAuraNFT _auraNFT) external onlyOwner {
        require(address(_auraNFT) != address(0), "AuraNFT is the zero address.");
        auraNFT = _auraNFT;
        emit NewAuraNFT(_auraNFT);
    }

    function addPair(uint _percentReward, address _pair) external onlyOwner {
        require(_pair != address(0), "`_pair` is the zero address.");
        pairsList.push(
            PairsList({
                pair: _pair,
                percentReward: _percentReward,
                isEnabled: true
            })
        );
        pairOfPairIds[_pair] = pairsList.length - 1;
    }

    function setPairPercentReward(uint _pairId, uint _percentReward) external onlyOwner {
        pairsList[_pairId].percentReward = _percentReward;
    }

    function setPairIsEnabled(uint _pairId, bool _isEnabled) external onlyOwner {
        pairsList[_pairId].isEnabled = _isEnabled;
    }

    function setAPReward(uint _apWagerOnSwap, uint _percentMarket, uint _percentAuction) external onlyOwner {
        apWagerOnSwap = _apWagerOnSwap;
        apPercentMarket = _percentMarket;
        apPercentAuction = _percentAuction;
    }

    /* 
     * WHITELIST 
     * 
     * This special group of utility functions are for interacting with the whitelist.
     */

    /**
     * @dev Add `token` to the whitelist.
     */
    function whitelistAdd(address token) public onlyOwner returns(bool) {
        require(token != address(0), "Zero address is invalid.");
        return EnumerableSet.add(whitelist, token);
    }

    /**
     * @dev Remove `token` from the whitelist.
     */
    function whitelistRemove(address token) public onlyOwner returns(bool) {
        require(token != address(0), "Zero address is invalid.");
        return EnumerableSet.remove(whitelist, token);
    }

    /**
     * @return true if the whitelist contains `token` and false otherwise.
     */
    function whitelistContains(address token) public view returns(bool) {
        return EnumerableSet.contains(whitelist, token);
    }

    /**
     * @return the number of whitelisted addresses.
     */
    function whitelistLength() public view returns(uint256) {
        return EnumerableSet.length(whitelist);
    }

    /**
     * @return the whitelisted address as `_index`.
     */
    function whitelistGet(uint _index) public view returns(address) {
        require(_index <= whitelistLength() - 1, "Index out of bounds.");
        return EnumerableSet.at(whitelist, _index);
    }
}
