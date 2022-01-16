// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../libraries/AuraLibrary.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IAuraNFT.sol";
import "../interfaces/IAuraToken.sol";
import "../swaps/AuraFactory.sol";
import "./AddressWhitelist.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@rari-capital/solmate/src/utils/ReentrancyGuard.sol';

// TODO - initialize certain storage variables: i.e. maxMiningAmount;
// TODO - Add NatSpec comments to latter functions.
// TODO - Set visibilities for storage variables. 

/**
 * @title Convert between Swap Reward Fees to Aura Points (ap/AP)
 */
contract SwapRewardsAndAP is Ownable, ReentrancyGuard {
    AddressWhitelist whitelist;
    IOracle oracle;
    IAuraNFT auraNFT;
    IAuraToken auraToken;

    address factory;
    address router;
    address targetToken;
    address targetAPToken;
    address market;
    address auction;

    uint apWagerOnSwap;
    uint defaultFeeDistribution;
    uint totalMined;
    uint maxMiningAmount;
    uint currentPhase;
    uint currentPhaseAP;
    uint maxMiningInPhase;
    uint apPercentMarket;
    uint apPercentAuction;
    uint totalAccruedAP;
    uint currentPhaseAP;
    uint maxAccruedAPInPhase;
    uint apWagerOnSwap;
    uint apPercentMarket;
    uint apPercentAuction;

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

        // Initialize a new whitelist for this contract.
        whitelist = new AddressWhitelist();
    }

    /**
     * @return _pairExists is true if the token pair of `a` and `b` exists and false otherwise.
     */
    function pairExists(address a, address b) public view returns(bool _pairExists) {
        address pair = AuraLibrary.pairFor(factory, a, b);
        PairsList memory pool = pairsList[pairOfpairIds[pair]];
        _pairExists = (pool.pair == pair);
    }
    
    /**
     * @dev get the different fees.
     */
    function getFees(address account, address input, address output, uint amount) 
        public
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

        if (pool.pair == pair && pool.enabled && whitelist.contains(input) && whitelist.contains(output)) {
            (uint feeAmount, uint apAmount) = getAmounts(amount, account);
            feeInAURA = getQuantity(output, feeAmount / swapFee, targetToken) * pool.percentReward / 100;
            feeInUSD = getQuantity(output, apAmount / apWagerOnSwap, targetAPToken);
            apAccrued = getQuantity(targetToken, feeInAURA, targetAPToken);
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

    function getQuantity(address outputToken, uint outputAmount, address anchorToken) public view returns(uint quantity) {
        if (outputToken == anchorToken) {
            quantity = outputAmount;
        } else if (AuraFactory(factory).getPair(outputToken, anchorToken) != address(0) 
            && pairExists(outputToken, anchorToken)) 
        {
            quantity = IOracle(oracle).consult(outputToken, outputAmount, anchorToken);
        } else {
            uint length = whitelist.getLength();
            for (uint i = 0; i < length; i++) {
                address intermediate = whitelist.get(i);
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

    function swap(address account, address input, address output, uint amount) public returns(bool) {
        require (msg.sender == router, "Caller is not the router.");

        if (!whitelist.contains(input) || !whitelist.contains(output)) { return false; }

        address pair = AuraLibrary.pairFor(factory, input, output);
        PairsList memory pool = pairsList[pairOfpairIds[pair]];
        if (pool.pair != pair || !pool.enabled) { return false; }

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

    function _accrueAP(address account, address output, uint amount) private {
        uint quantity = getQuantity(output, amount, targetAPToken);
        if (quantity > 0) {
            totalAccruedAP += quantity;
            if (totalAccruedAP <= currentPhaseAP * maxAccruedAPInPhase) {
                auraNFT.accrueAP(account, quantity);
            }
        }
    }

    function getRewardBalance(address account) public view returns(uint) {
        return _balances[account];
    }

    function permit(address spender, uint value, uint8 v, bytes32 r, bytes32 s) private {
        bytes32 message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(spender, value, nonces[spender]++))));
        address recoveredAddress = ecrecover(message, v, r, s);
        require(recoveredAddress != address(0) && recoveredAddress == spender, "Invalid signature.");
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

    function setPhase(uint _phase) public onlyOwner {
        currentPhase = _phase;
        emit NewPhase(_phase);
    }

    function setPhaseAP(uint _phaseAP) public onlyOwner {
        currentPhaseAP = _phaseAP;
        emit NewPhaseAP(_phaseAP);
    }

    function setRouter(address _router) public onlyOwner {
        require(_router != address(0), "Router is the zero address.");
        router = _router;
        emit NewRouter(_router);
    }

    function setMarket(address _market) public onlyOwner {
        require(_market != address(0), "Market is the zero address.");
        market = _market;
        emit NewMarket(_market);
    }

    function setFactory(address _factory) public onlyOwner {
        require(_factory != address(0), "Factory is the zero address.");
        factory = _factory;
        emit NewFactory(_factory);
    }

    function setAuraNFT(IAuraNFT _auraNFT) public onlyOwner {
        require(address(_auraNFT) != address(0), "AuraNFT is the zero address.");
        auraNFT = _auraNFT;
        emit NewAuraNFT(_auraNFT);
    }

    function setOracle(IOracle _oracle) public onlyOwner {
        require(address(_oracle) != address(0), "Oracle is the zero address.");
        oracle = _oracle;
        emit NewOracle(_oracle);
    }

    function getPairsListLength() public view returns(uint) {
        return pairsList.length;
    }

    function addPair(uint _percentReward, address _pair) public onlyOwner {
        require(_pair != address(0), "`_pair` is the zero address.");
        pairsList.push(
            PairsList({
                pair: _pair,
                percentReward: _percentReward,
                enabled: true
            })
        );
        pairOfpairIds[_pair] = getPairsListLength() - 1;
    }

    function setPair(uint _pairId, uint _percentReward) public onlyOwner {
        pairsList[_pairId].percentReward = _percentReward;
    }

    function setPairEnabled(uint _pairId, bool _enabled) public onlyOwner {
        pairsList[_pairId].enabled = _enabled;
    }

    function setAPReward(uint _apWagerOnSwap, uint _percentMarket, uint _percentAuction) public onlyOwner {
        apWagerOnSwap = _apWagerOnSwap;
        apPercentMarket = _percentMarket;
        apPercentAuction = _percentAuction;
    }

    function setFeeDistribution(uint _distribution) public {
        require(_distribution <= defaultFeeDistribution, "Invalid fee distribution.");
        feeDistribution[msg.sender] = _distribution;
    }
}
