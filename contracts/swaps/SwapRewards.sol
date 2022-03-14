// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../libraries/AuraLibrary.sol';
import '../swaps/AuraFactory.sol';
import '../interfaces/IOracleFactory.sol';
import '../interfaces/ISwapRewards.sol';
import '../referrals/ReferralRegister.sol';
import '../interfaces/IAuraToken.sol';
import '../interfaces/IAuraNFT.sol';

/**
 * @title Accrue AURA/AP to the swap caller
 */
contract SwapRewards is ISwapRewards, Ownable {
    AuraFactory public factory;
    IOracleFactory public oracleFactory;
    ReferralRegister public refReg;
    IAuraToken public auraToken;
    IAuraNFT public auraNFT;

    // No functions are called on these 
    // so only addresses are needed.
    address public router;
    address public apToken;

    // Determines the split between Aura and AP rewards.
    // 10    -> Rewards are 1% AURA and 99% AP.
    // 500   -> Rewards are 50% AURA and 50% AP. 
    // 1000  -> Rewards are 100% AURA and 0% AP.
    uint public splitRewardPercent;

    // Percents earned on rewards after split.
    // 10 -> 1%, 100 -> 10%, 1000 -> 100%
    uint public auraRewardPercent;
    uint public apRewardPercent;

    event AccrueAp(address indexed account, uint ap);
    event AccrueAura(address indexed account, uint aura);
    event Swap(
        address indexed account, 
        address indexed tokenIn, 
        address indexed tokenOut, 
        uint amountIn
    );
    
    constructor(
        AuraFactory _factory, 
        address _router, 
        IOracleFactory _oracleFactory,
        ReferralRegister _refReg,
        IAuraToken _auraToken,
        IAuraNFT _auraNFT,
        address _apToken,
        uint _splitRewardPercent,
        uint _auraRewardPercent,
        uint _apRewardPercent
    ) {
        setFactory(_factory);
        setRouter(_router);
        setOracleFactory(_oracleFactory);
        setRefReg(_refReg);
        setAuraToken(_auraToken);
        setAuraNFT(_auraNFT);
        setApToken(_apToken);

        setSplitRewardPercent(_splitRewardPercent);
        setAuraRewardPercent(_auraRewardPercent);
        setApRewardPercent(_apRewardPercent);
    }

    /**
     * @dev Accrue AURA/AP to the swap caller and accrue AURA to the swap caller's referrer
     */
    function swap(address account, address tokenIn, address tokenOut, uint amountIn) external {
        require (msg.sender == router, "SwapFee: CALLER IS NOT THE ROUTER");

        // Accrue AURA/AP to the swap caller
        (uint auraAmount, uint apAmount) = splitReward(amountIn);
        accrueAura(account, tokenOut, auraAmount);
        accrueAP(account, tokenOut, apAmount);

        // Accrue AURA to the swap caller referrer.
        refReg.recordSwapReward(account, getAmountOut(tokenOut, amountIn, address(auraToken)));

        emit Swap(
            account,
            tokenIn,
            tokenOut,
            amountIn
        );
    }

    /**
     * @dev returns AURA and AP rewards split by splitRewardPercent percentage
     *      such that auraAmount + apAmount = `amount`
     */
    function splitReward(uint amount) public view returns (uint auraAmount, uint apAmount) {
        auraAmount = amount * splitRewardPercent / 1000;
        apAmount = amount - auraAmount;
    }

    /**
     * @dev Accrue AURA to `account` based on `amountIn` of `tokenIn`.
     */
    function accrueAura(address account, address tokenIn, uint amountIn) private {
        uint auraOut = getAmountOut(tokenIn, amountIn, address(auraToken));
        auraOut = auraOut * auraRewardPercent / 1000;
        if (auraOut > 0) {
            auraToken.mint(account, auraOut);
            emit AccrueAura(account, auraOut);
        }
    }

    /**
     * @dev Accrue AP to `account` based on `amountIn` of `tokenIn`.
     */
    function accrueAP(address account, address tokenIn, uint amountIn) private {
        uint apOut = getAmountOut(tokenIn, amountIn, apToken);
        apOut = apOut * apRewardPercent / 1000;
        if (apOut > 0) {
            auraNFT.accruePoints(account, apOut);
            emit AccrueAp(account, apOut);
        }
    }

    /**
     * @dev Gets the amount of `tokenOut` equivalent in value to `amountIn` many `tokenIn`.
     */
    function getAmountOut(address tokenIn, uint amountIn, address tokenOut) public view returns (uint amountOut) {
        amountOut = IOracleFactory(oracleFactory).consult(tokenIn, amountIn, tokenOut);
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "SwapFee: Invalid address");
        _;
    }

    function setFactory(AuraFactory _factory) public onlyOwner validAddress(address(_factory)) {
        factory = _factory;
    }

    function setRouter(address _router) public onlyOwner validAddress(_router) {
        router = _router;
    }

    function setOracleFactory(IOracleFactory _oracleFactory) public onlyOwner validAddress(address(_oracleFactory)) {
        oracleFactory = _oracleFactory;
    }

    function setRefReg(ReferralRegister _refReg) public onlyOwner validAddress(address(_refReg)) {
        refReg = _refReg;
    }

    function setAuraToken(IAuraToken _auraToken) public onlyOwner validAddress(address(_auraToken)) {
        auraToken = _auraToken;
    }

    function setAuraNFT(IAuraNFT _auraNFT) public onlyOwner validAddress(address(_auraNFT)) {
        auraNFT = _auraNFT;
    }

    function setApToken(address _apToken) public onlyOwner validAddress(_apToken) {
        apToken = _apToken;
    }

    // Note that all percentages in this contract are out of 1000,
    // so percentage == 1 -> 0.1% and 1000 -> 100%
    modifier validPercentage(uint percentage) {
        require(percentage <= 1000, "SwapFee: Invalid percentage");
        _;
    }

    function setSplitRewardPercent(uint _splitRewardPercent) 
        public
        onlyOwner 
        validPercentage(_splitRewardPercent) 
    {
        splitRewardPercent = _splitRewardPercent;
    }

    function setApRewardPercent(uint _apRewardPercent) 
        public
        onlyOwner 
        validPercentage(_apRewardPercent) 
    {
        apRewardPercent = _apRewardPercent;
    }

    function setAuraRewardPercent(uint _auraRewardPercent) 
        public
        onlyOwner 
        validPercentage(_auraRewardPercent) 
    {
        auraRewardPercent = _auraRewardPercent;
    }
}
