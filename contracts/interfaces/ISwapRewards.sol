// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface ISwapRewards {
    function swap(address account, address input, address output, uint256 amount) external;
    function splitReward(uint amount) external view returns (uint helixAmount, uint apAmount);
    function getAmountOut(address tokenIn, uint amountIn, address tokenOut) external view returns (uint amountOut);
}
