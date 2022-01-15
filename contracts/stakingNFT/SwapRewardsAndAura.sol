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
// TODO - clarify distinction between AURA and points: i.e. BSW and RobiBoost. 
//        May require renaming variables with aura in name.

contract SwapRewardsAndAura is Ownable, ReentrancyGuard {
    AddressWhitelist whitelist;
    IOracle oracle;
    IAuraNFT auraNFT;
    IAuraToken auraToken;

    address factory;
    address router;
    address targetToken;
    address targetAuraToken;
    address market;
    address auction;

    uint auraWagerOnSwap;
    uint defaultFeeDistribution;
    uint totalMined;
    uint maxMiningAmount;
    uint currentPhase;
    uint maxMiningInPhase;
    uint auraPercentMarket;
    uint auraPercentAuction;
    uint totalAccruedAura;
    uint currentPhaseAura;
    uint maxAccruedAuraInPhase;

    struct PairsList {
        address pair;
        uint percentReward;
        bool enabled;
    }

    PairsList[] pairsList;

    mapping(address => uint) pairOfPid;
    mapping(address => uint) feeDistribution;
    mapping(address => uint) _balances;
    mapping(address => uint) nonces;

    event Rewarded(address account, address input, address output, uint amount, uint quantity);
    event Withdraw(address user, uint amount);

    constructor(
        address _factory,
        address _router, 
        address _targetToken,
        address _targetAuraToken,
        IOracle _oracle,
        IAuraNFT _auraNFT,
        IAuraToken _auraToken
    ) {
        require(
            _factory != address(0)
            && _router != address(0)
            && _targetToken != address(0)
            && _targetAuraToken != address(0),
            "Address cannot be zero."
        );
        factory = _factory;
        router = _router;
        targetToken = _targetToken;
        targetAuraToken = _targetAuraToken;
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
        PairsList memory pool = pairsList[pairOfPid[pair]];
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
            uint pointsAccrued
        )
    {
        uint swapFee = AuraLibrary.getSwapFee(factory, input, output); 
        address pair = AuraLibrary.pairFor(factory, input, output);
        PairsList memory pool = pairsList[pairOfPid[pair]];

        if (pool.pair == pair && pool.enabled && whitelist.contains(input) && whitelist.contains(output)) {
            (uint feeAmount, uint pointAmount) = getAmounts(amount, account);
            feeInAURA = getQuantity(output, feeAmount / swapFee, targetToken) * pool.percentReward / 100;
            feeInUSD = getQuantity(output, pointAmount / auraWagerOnSwap, targetAuraToken);
            pointsAccrued = getQuantity(targetToken, feeInAURA, targetAuraToken);
        }
    }

    /**
     * @return feeAmount due to the account.
     * @return auraAmount due to the account.
     */
    function getAmounts(uint amount, address account) internal view returns(uint feeAmount, uint auraAmount) {
        feeAmount = amount * (defaultFeeDistribution - feeDistribution[account]) / 100;
        auraAmount = amount - feeAmount;
    }

    /**
     * TODO
     */
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

    /**
    * TODO
    */
    function swap(address account, address input, address output, uint amount) public returns(bool) {
        require (msg.sender == router, "Caller is not the router.");

        if (!whitelist.contains(input) || !whitelist.contains(output)) { return false; }

        address pair = AuraLibrary.pairFor(factory, input, output);
        PairsList memory pool = pairsList[pairOfPid[pair]];
        if (pool.pair != pair || !pool.enabled) { return false; }

        uint pairFee = AuraLibrary.getSwapFee(factory, input, output);
        (uint feeAmount, uint auraAmount) = getAmounts(amount, account);
        uint fee = feeAmount / pairFee;
        auraAmount = auraAmount / auraWagerOnSwap;

        uint quantity = getQuantity(output, fee, targetToken);
        if ((totalMined + quantity) <= maxMiningAmount && (totalMined + quantity) <= (currentPhase * maxMiningInPhase)) {
            _balances[account] += quantity;
            emit Rewarded(account, input, output, amount, quantity);
        }

        return true;
    }

    /**
     * TODO
     */
    function accrueAuraFromMarket(address account, address fromToken, uint amount) public {
        require(msg.sender == market, "Caller is not the market.");
        amount = amount * auraPercentMarket / 10000;
        _accrueAura(account, fromToken, amount);
    }

    /**
     * TODO
     */
    function accrueAuraFromAuction(address account, address fromToken, uint amount) public {
        require(msg.sender == auction, "Caller is not the auction.");
        amount = amount * auraPercentAuction / 10000;
        _accrueAura(account, fromToken, amount);
    }

    /**
     * TODO
     */
    function _accrueAura(address account, address output, uint amount) private {
        uint quantity = getQuantity(output, amount, targetAuraToken);
        if (quantity > 0) {
            totalAccruedAura += quantity;
            if (totalAccruedAura <= currentPhaseAura * maxAccruedAuraInPhase) {
                auraNFT.accruePoints(account, quantity);
            }
        }
    }

    /**
     * TODO
     */
    function getRewardBalance(address account) public view returns(uint) {
        return _balances[account];
    }

    /**
     * TODO
     */
    function permit(address spender, uint value, uint8 v, bytes32 r, bytes32 s) private {
        bytes32 message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(spender, value, nonces[spender]++))));
        address recoveredAddress = ecrecover(message, v, r, s);
        require(recoveredAddress != address(0) && recoveredAddress == spender, "Invalid signature.");
    }

    /**
     * TODO
     */
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
}
