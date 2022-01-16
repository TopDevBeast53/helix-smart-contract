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

// TODO - initialize certain storage variables: i.e. maxMiningAmount;
// TODO - Add NatSpec comments to latter functions.
// TODO - Set visibilities for storage variables. 

/**
 * @title Convert between Swap Reward Fees to Aura Points (ap/AP)
 */
contract SwapRewardsAndAP is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet whitelist;

    IOracle oracle;
    IAuraNFT auraNFT;
    IAuraToken auraToken;

    address factory;
    address router;
    address market;
    address auction;
    address targetToken;
    address targetAPToken;

    uint maxMiningAmount = 100000000 ether;
    uint maxMiningInPhase = 5000 ether;
    uint maxAccruedAPInPhase = 5000 ether;

    uint currentPhase = 1;
    uint currentPhaseAP = 1; 
    
    uint totalMined = 0;
    uint totalAccruedAP = 0;

    uint apWagerOnSwap = 1500;
    uint apPercentMarket = 10000; // (div 10000)
    uint apPercentAuction = 10000; // (div 10000)

    uint defaultFeeDistribution = 90;

    struct PairsList {
        address pair;
        uint percentReward;
        bool enabled;
    }

    PairsList[] pairsList;

    mapping(address => uint) pairOfpairIds;
    mapping(address => uint) feeDistribution;
    mapping(address => uint) _balances;
    mapping(address => uint) nonces;

    event Rewarded(address account, address input, address output, uint amount, uint quantity);
    event Withdraw(address user, uint amount);
    event NewPhase(uint phase);
    event NewPhaseAP(uint phaseAP);
    event NewRouter(address router);
    event NewMarket(address market);
    event NewFactory(address factory);
    event NewAuraNFT(IAuraNFT auraNFT);
    event NewOracle(IOracle oracle);

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
     * PUBLIC CORE 
     *
     * These functions constitue this contract's core, user-facing functionality. 
     */

    /**
     * @dev swap the `input` token for the `output` token and credit the result to `account`.
     */
    function swap(address account, address input, address output, uint amount) public returns(bool) {
        require (msg.sender == router, "Caller is not the router.");

        if (!whitelistContains(input) || !whitelistContains(output)) { return false; }

        address pair = AuraLibrary.pairFor(factory, input, output);
        PairsList memory pool = pairsList[pairOfpairIds[pair]];
        if (!pool.enabled || pool.pair != pair) { return false; }

        uint pairFee = AuraLibrary.getSwapFee(factory, input, output);
        (uint feeAmount, uint apAmount) = getAmounts(amount, account);
        uint fee = feeAmount / pairFee;
        apAmount = apAmount / apWagerOnSwap;

        uint quantity = getQuantity(output, fee, targetToken);
        if ((totalMined + quantity) <= maxMiningAmount && (totalMined + quantity) <= (currentPhase * maxMiningInPhase)) {
            _balances[account] += quantity;
            emit Rewarded(account, input, output, amount, quantity);
        }

        return true;
    }

    function accrueAuraFromMarket(address account, address fromToken, uint amount) public {
        require(msg.sender == market, "Caller is not the market.");
        amount = amount * apPercentMarket / 10000;
        _accrueAP(account, fromToken, amount);
    }

    function accrueAuraFromAuction(address account, address fromToken, uint amount) public {
        require(msg.sender == auction, "Caller is not the auction.");
        amount = amount * apPercentAuction / 10000;
        _accrueAP(account, fromToken, amount);
    }

    function withdraw(uint8 v, bytes32 r, bytes32 s) public nonReentrant returns(bool) {
        require (totalMined < maxMiningAmount, "All tokens have been mined.");

        uint balance = _balances[msg.sender];
        require ((totalMined + balance) <= (currentPhase * maxMiningInPhase), "All tokens in this phase have been mined.");
       
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
     * EXTERNAL SETTERS 
     * 
     * These contracts provide callers with useful functionality for managing their accounts.
     */

    function setFeeDistribution(uint _distribution) external {
        require(_distribution <= defaultFeeDistribution, "Invalid fee distribution.");
        feeDistribution[msg.sender] = _distribution;
    }

    /* 
     * PUBLIC UTILS 
     * 
     * These utility functions are used within this contract but are useful and safe enough 
     * to expose to callers as well. 
     */

    function getQuantity(address outputToken, uint outputAmount, address anchorToken) public view returns(uint quantity) {
        if (outputToken == anchorToken) {
            quantity = outputAmount;
        } else if (AuraFactory(factory).getPair(outputToken, anchorToken) != address(0) 
            && pairExists(outputToken, anchorToken)) 
        {
            quantity = IOracle(oracle).consult(outputToken, outputAmount, anchorToken);
        } else {
            uint length = getWhitelistLength();
            for (uint i = 0; i < length; i++) {
                address intermediate = whitelistGet(i);
                if (AuraFactory(factory).getPair(outputToken, intermediate) != address(0)
                    && AuraFactory(factory).getPair(intermediate, anchorToken) != address(0)
                    && pairExists(intermediate, anchorToken))
                {
                    uint interQuantity = IOracle(oracle).consult(outputToken, outputAmount, intermediate);
                    quantity = IOracle(oracle).consult(intermediate, interQuantity, anchorToken);
                    break;
                }
            }
        }
    }

    /**
     * @return _pairExists is true if the token pair of `a` and `b` exists and false otherwise.
     */
    function pairExists(address a, address b) public view returns(bool _pairExists) {
        address pair = AuraLibrary.pairFor(factory, a, b);
        PairsList memory pool = pairsList[pairOfpairIds[pair]];
        _pairExists = (pool.pair == pair);
    }

    /* 
     * PRIVATE UTILS 
     * 
     * These functions are used within this contract but would be unsafe or useless
     * if exposed to callers.
     */

    function permit(address spender, uint value, uint8 v, bytes32 r, bytes32 s) private {
        bytes32 message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(spender, value, nonces[spender]++))));
        address recoveredAddress = ecrecover(message, v, r, s);
        require(recoveredAddress != address(0) && recoveredAddress == spender, "Invalid signature.");
    }

    function _accrueAP(address account, address output, uint amount) private {
        uint quantity = getQuantity(output, amount, targetAPToken);
        if (quantity > 0) {
            totalAccruedAP += quantity;
            if (totalAccruedAP <= currentPhaseAP * maxAccruedAPInPhase) {
                auraNFT.accrueAP(account, quantity);
            }
        }
    }

    /**
     * @return feeAmount due to the account.
     * @return apAmount due to the account.
     */
    function getAmounts(uint amount, address account) internal view returns(uint feeAmount, uint apAmount) {
        feeAmount = amount * (defaultFeeDistribution - feeDistribution[account]) / 100;
        apAmount = amount - feeAmount;
    }

    /* 
     * EXTERNAL GETTERS 
     * 
     * These functions provide useful information to callers about this contract's state. 
     */

    function getPairsListLength() external view returns(uint) {
        return pairsList.length;
    }

    function getRewardBalance(address account) external view returns(uint) {
        return _balances[account];
    }

    /**
     * @dev get the different fees.
     */
    function getFees(address account, address input, address output, uint amount) 
        external
        view
        returns(
            uint feeInAURA,
            uint feeInUSD,
            uint apAccrued
        )
    {
        uint swapFee = AuraLibrary.getSwapFee(factory, input, output); 
        address pair = AuraLibrary.pairFor(factory, input, output);
        PairsList memory pool = pairsList[pairOfpairIds[pair]];

        if (pool.pair == pair && pool.enabled && whitelistContains(input) && whitelistContains(output)) {
            (uint feeAmount, uint apAmount) = getAmounts(amount, account);
            feeInAURA = getQuantity(output, feeAmount / swapFee, targetToken) * pool.percentReward / 100;
            feeInUSD = getQuantity(output, apAmount / apWagerOnSwap, targetAPToken);
            apAccrued = getQuantity(targetToken, feeInAURA, targetAPToken);
        }
    }

    /* 
     * ONLY OWNER SETTERS 
     * 
     * These functions alter contract core data and are only available to the owner. 
     */

    function setPhase(uint _phase) external onlyOwner {
        currentPhase = _phase;
        emit NewPhase(_phase);
    }

    function setPhaseAP(uint _phaseAP) external onlyOwner {
        currentPhaseAP = _phaseAP;
        emit NewPhaseAP(_phaseAP);
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

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Factory is the zero address.");
        factory = _factory;
        emit NewFactory(_factory);
    }

    function setAuraNFT(IAuraNFT _auraNFT) external onlyOwner {
        require(address(_auraNFT) != address(0), "AuraNFT is the zero address.");
        auraNFT = _auraNFT;
        emit NewAuraNFT(_auraNFT);
    }

    function setOracle(IOracle _oracle) external onlyOwner {
        require(address(_oracle) != address(0), "Oracle is the zero address.");
        oracle = _oracle;
        emit NewOracle(_oracle);
    }

    function addPair(uint _percentReward, address _pair) external onlyOwner {
        require(_pair != address(0), "`_pair` is the zero address.");
        pairsList.push(
            PairsList({
                pair: _pair,
                percentReward: _percentReward,
                enabled: true
            })
        );
        pairOfpairIds[_pair] = pairsList.length - 1;
    }

    function setPair(uint _pairId, uint _percentReward) external onlyOwner {
        pairsList[_pairId].percentReward = _percentReward;
    }

    function setPairEnabled(uint _pairId, bool _enabled) external onlyOwner {
        pairsList[_pairId].enabled = _enabled;
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
     * @dev Add `_addr` to the whitelist.
     */
    function whitelistAdd(address _addr) public onlyOwner returns(bool) {
        require(_addr != address(0), "Zero address is invalid.");
        return EnumerableSet.add(whitelist, _addr);
    }

    /**
     * @dev Remove `_addr` from the whitelist.
     */
    function whitelistRemove(address _addr) public onlyOwner returns(bool) {
        require(_addr != address(0), "Zero address is invalid.");
        return EnumerableSet.remove(whitelist, _addr);
    }

    /**
     * @return true if the whitelist contains `_addr` and false otherwise.
     */
    function whitelistContains(address _addr) public view returns(bool) {
        return EnumerableSet.contains(whitelist, _addr);
    }

    /**
     * @return the number of whitelisted addresses.
     */
    function getWhitelistLength() public view returns(uint256) {
        return EnumerableSet.length(whitelist);
    }

    /**
     * @return the whitelisted address as `_index`.
     */
    function whitelistGet(uint _index) public view returns(address) {
        require(_index <= getWhitelistLength() - 1, "Index out of bounds.");
        return EnumerableSet.at(whitelist, _index);
    }
}
