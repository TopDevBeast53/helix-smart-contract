// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IOracle {
    function consult(address tokenIn, uint amountIn) external view returns (uint amountOut);
    function update() external;
}
