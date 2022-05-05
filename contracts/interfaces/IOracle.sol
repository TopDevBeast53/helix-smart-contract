// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';

interface IOracle {
    function consult(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);
    function update() external;
    function PERIOD() external view returns (uint256);
    function pair() external view returns (IUniswapV2Pair);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function price0CumulativeLast() external view returns (uint256);
    function price1CumulativeLast() external view returns (uint256);
    function blockTimestampLast() external view returns (uint32);
    function price0Average() external view returns (FixedPoint.uq112x112 memory);
    function price1Average() external view returns (FixedPoint.uq112x112 memory);
}
