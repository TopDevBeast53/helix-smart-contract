// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IHelixPair {
    function MINIMUM_LIQUIDITY() external view returns (uint256);

    function factory() external view returns (address);
    function token0() external view returns (address); 
    function token1() external view returns (address);

    function price0CumulativeLast() external view returns (uint256);
    function price1CumulativeLast() external view returns (uint256);
    function kLast() external view returns (uint256);

    function swapFee() external view returns (uint32);
    function devFee() external view returns (uint32);

    function setSwapFee(uint32 _swapFee) external;
    function setDevFee(uint32 _devFee) external;

    function initialize(address _token0, address _token1) external;
    function swap(uint256 amount0Out, uint256 amount1Out, address to) external;
    function skim(address to) external;
    function sync() external;

    function mint(address to) external returns (uint256 liquidity);
    function burn(address to) external returns (uint256 amount0, uint256 amount1);

    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast);
}
