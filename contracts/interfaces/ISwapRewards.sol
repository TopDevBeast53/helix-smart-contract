// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface ISwapRewards {
    function swap(address account, address input, address output, uint256 amount) external;
    function splitReward(uint256 amount) external view returns (uint256 helixAmount, uint256 apAmount);
    function getAmountOut(address tokenIn, uint256 amountIn, address tokenOut) external view returns (uint256 amountOut);
}
