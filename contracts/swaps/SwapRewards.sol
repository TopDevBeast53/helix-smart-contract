// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOracleFactory.sol";
import "../interfaces/IHelixToken.sol";
import "../interfaces/IHelixNFT.sol";
import "../interfaces/IReferralRegister.sol";
import "../libraries/Percent.sol";

/**
 * @title Accrue HELIX/AP to the swap caller
 */
contract SwapRewards is Ownable {
    IOracleFactory public oracleFactory;
    IHelixToken public helixToken;
    IHelixNFT public helixNFT;
    IReferralRegister public refReg;

    // No functions are called on these 
    // so only addresses are needed.
    address public router;
    address public hpToken;

    // Determines the split between Helix and AP rewards.
    // 1    -> Rewards are 1% HELIX and 99% AP.
    // 50   -> Rewards are 50% HELIX and 50% AP. 
    // 100  -> Rewards are 100% HELIX and 0% AP.
    uint256 public splitRewardPercent;

    // Percents earned on rewards after split.
    // 1 -> 1%, 10 -> 10%, 100 -> 100%
    uint256 public helixRewardPercent;
    uint256 public apRewardPercent;

    event AccrueHelix(address indexed account, uint256 helix);
    event Swap(
        address indexed account, 
        address indexed tokenIn, 
        address indexed tokenOut, 
        uint256 amountIn
    );

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "SwapFee: zero address");
        _;
    }

    modifier onlyValidPercent(uint256 percent) {
        require(Percent.isValidPercent(percent), "SwapFee: invalid percent");
        _;
    }

    constructor(
        address _router, 
        IOracleFactory _oracleFactory,
        IReferralRegister _refReg,
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
        // TODO : apAmount should be removed
        (uint256 helixAmount, uint256 apAmount) = splitReward(amountIn);
        accrueHelix(account, tokenOut, helixAmount);

        // Accrue HELIX to the swap caller referrer.
        refReg.recordSwapReward(account, getAmountOut(tokenOut, amountIn, address(helixToken)));

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
        (helixAmount, apAmount) = Percent.splitByPercent(amount, splitRewardPercent);
    }

    /**
     * @dev Accrue HELIX to `account` based on `amountIn` of `tokenIn`.
     */
    function accrueHelix(address account, address tokenIn, uint256 amountIn) private {
        uint256 helixOut = getAmountOut(tokenIn, amountIn, address(helixToken));
        helixOut = Percent.getPercentage(helixOut, helixRewardPercent);
        if (helixOut > 0) {
            helixToken.mint(account, helixOut);
            emit AccrueHelix(account, helixOut);
        }
    }

    /**
     * @dev Gets the amount of `tokenOut` equivalent in value to `amountIn` many `tokenIn`.
     */
    function getAmountOut(address tokenIn, uint256 amountIn, address tokenOut) public view returns (uint256 amountOut) {
        amountOut = IOracleFactory(oracleFactory).consult(tokenIn, amountIn, tokenOut);
    }

    function setRouter(address _router) external onlyOwner onlyValidAddress(_router) {
        router = _router;
    }

    function setOracleFactory(IOracleFactory _oracleFactory) external onlyOwner onlyValidAddress(address(_oracleFactory)) {
        oracleFactory = _oracleFactory;
    }

    function setRefReg(IReferralRegister _refReg) external onlyOwner onlyValidAddress(address(_refReg)) {
        refReg = _refReg;
    }

    function setHelixToken(IHelixToken _helixToken) external onlyOwner onlyValidAddress(address(_helixToken)) {
        helixToken = _helixToken;
    }

    function setHelixNFT(IHelixNFT _helixNFT) external onlyOwner onlyValidAddress(address(_helixNFT)) {
        helixNFT = _helixNFT;
    }

    function setHpToken(address _hpToken) external onlyOwner onlyValidAddress(_hpToken) {
        hpToken = _hpToken;
    }

    function setSplitRewardPercent(uint256 _splitRewardPercent) 
        external
        onlyOwner 
        onlyValidPercent(_splitRewardPercent) 
    {
        splitRewardPercent = _splitRewardPercent;
    }

    function setApRewardPercent(uint256 _apRewardPercent) 
        external
        onlyOwner 
        onlyValidPercent(_apRewardPercent) 
    {
        apRewardPercent = _apRewardPercent;
    }

    function setHelixRewardPercent(uint256 _helixRewardPercent) 
        external
        onlyOwner 
        onlyValidPercent(_helixRewardPercent) 
    {
        helixRewardPercent = _helixRewardPercent;
    }
}
