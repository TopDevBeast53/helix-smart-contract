// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOracleFactory.sol";
import "../interfaces/ISwapRewards.sol";
import "../interfaces/IHelixToken.sol";
import "../interfaces/IHelixNFT.sol";
import "../interfaces/IReferralRegister.sol";

/**
 * @title Accrue HELIX/AP to the swap caller
 */
contract SwapRewards is ISwapRewards, Ownable {
    IOracleFactory public oracleFactory;
    IHelixToken public helixToken;
    IHelixNFT public helixNFT;

    // No functions are called on these 
    // so only addresses are needed.
    address public router;
    address public refReg;
    address public hpToken;

    // Determines the split between Helix and AP rewards.
    // 10    -> Rewards are 1% HELIX and 99% AP.
    // 500   -> Rewards are 50% HELIX and 50% AP. 
    // 1000  -> Rewards are 100% HELIX and 0% AP.
    uint256 public splitRewardPercent;

    // Percents earned on rewards after split.
    // 10 -> 1%, 100 -> 10%, 1000 -> 100%
    uint256 public helixRewardPercent;
    uint256 public apRewardPercent;

    event AccrueAp(address indexed account, uint256 ap);
    event AccrueHelix(address indexed account, uint256 helix);
    event Swap(
        address indexed account, 
        address indexed tokenIn, 
        address indexed tokenOut, 
        uint256 amountIn
    );
    
    constructor(
        address _router, 
        IOracleFactory _oracleFactory,
        address _refReg,
        IHelixToken _helixToken,
        IHelixNFT _helixNFT,
        address _hpToken,
        uint256 _splitRewardPercent,
        uint256 _helixRewardPercent,
        uint256 _apRewardPercent
    ) {
        router = _router;
        oracleFactory = _oracleFactory;
        refReg = _refReg;
        helixToken = _helixToken;
        helixNFT = _helixNFT;
        hpToken = _hpToken;
        splitRewardPercent = _splitRewardPercent;
        helixRewardPercent = _helixRewardPercent;
        apRewardPercent = _apRewardPercent;
    }

    /**
     * @dev Accrue HELIX/AP to the swap caller and accrue HELIX to the swap caller's referrer
     */
    function swap(address account, address tokenIn, address tokenOut, uint256 amountIn) external {
        require (msg.sender == router, "SwapFee: not router");

        // Accrue HELIX/AP to the swap caller
        (uint256 helixAmount, uint256 apAmount) = splitReward(amountIn);
        accrueHelix(account, tokenOut, helixAmount);
        accrueAP(account, tokenOut, apAmount);

        // Accrue HELIX to the swap caller referrer.
        IReferralRegister(refReg).recordSwapReward(account, getAmountOut(tokenOut, amountIn, address(helixToken)));

        emit Swap(
            account,
            tokenIn,
            tokenOut,
            amountIn
        );
    }

    /**
     * @dev returns HELIX and AP rewards split by splitRewardPercent percentage
     *      such that helixAmount + apAmount = `amount`
     */
    function splitReward(uint256 amount) public view returns (uint256 helixAmount, uint256 apAmount) {
        helixAmount = amount * splitRewardPercent / 1000;
        apAmount = amount - helixAmount;
    }

    /**
     * @dev Accrue HELIX to `account` based on `amountIn` of `tokenIn`.
     */
    function accrueHelix(address account, address tokenIn, uint256 amountIn) private {
        uint256 helixOut = getAmountOut(tokenIn, amountIn, address(helixToken));
        helixOut = helixOut * helixRewardPercent / 1000;
        if (helixOut > 0) {
            helixToken.mint(account, helixOut);
            emit AccrueHelix(account, helixOut);
        }
    }

    /**
     * @dev Accrue AP to `account` based on `amountIn` of `tokenIn`.
     */
    function accrueAP(address account, address tokenIn, uint256 amountIn) private {
        uint256 apOut = getAmountOut(tokenIn, amountIn, hpToken);
        apOut = apOut * apRewardPercent / 1000;
        if (apOut > 0) {
            helixNFT.accruePoints(account, apOut);
            emit AccrueAp(account, apOut);
        }
    }

    /**
     * @dev Gets the amount of `tokenOut` equivalent in value to `amountIn` many `tokenIn`.
     */
    function getAmountOut(address tokenIn, uint256 amountIn, address tokenOut) public view returns (uint256 amountOut) {
        amountOut = IOracleFactory(oracleFactory).consult(tokenIn, amountIn, tokenOut);
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "SwapFee: zero address");
        _;
    }

    function setRouter(address _router) external onlyOwner validAddress(_router) {
        router = _router;
    }

    function setOracleFactory(IOracleFactory _oracleFactory) external onlyOwner validAddress(address(_oracleFactory)) {
        oracleFactory = _oracleFactory;
    }

    function setRefReg(address _refReg) external onlyOwner validAddress(_refReg) {
        refReg = _refReg;
    }

    function setHelixToken(IHelixToken _helixToken) external onlyOwner validAddress(address(_helixToken)) {
        helixToken = _helixToken;
    }

    function setHelixNFT(IHelixNFT _helixNFT) external onlyOwner validAddress(address(_helixNFT)) {
        helixNFT = _helixNFT;
    }

    function setHpToken(address _hpToken) external onlyOwner validAddress(_hpToken) {
        hpToken = _hpToken;
    }

    // Note that all percentages in this contract are out of 1000,
    // so percentage == 1 -> 0.1% and 1000 -> 100%
    modifier validPercentage(uint256 percentage) {
        require(percentage <= 1000, "SwapFee: invalid percentage");
        _;
    }

    function setSplitRewardPercent(uint256 _splitRewardPercent) 
        external
        onlyOwner 
        validPercentage(_splitRewardPercent) 
    {
        splitRewardPercent = _splitRewardPercent;
    }

    function setApRewardPercent(uint256 _apRewardPercent) 
        external
        onlyOwner 
        validPercentage(_apRewardPercent) 
    {
        apRewardPercent = _apRewardPercent;
    }

    function setHelixRewardPercent(uint256 _helixRewardPercent) 
        external
        onlyOwner 
        validPercentage(_helixRewardPercent) 
    {
        helixRewardPercent = _helixRewardPercent;
    }
}
