// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IOracle {
    function consult(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);
    function update() external;
}
