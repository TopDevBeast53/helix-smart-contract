// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol";
import "@uniswap/lib/contracts/libraries/FixedPoint.sol";

import "../libraries/HelixLibrary.sol";

// fixed window oracle that recomputes the average price for the entire period once every period
// note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period
contract Oracle {
    using FixedPoint for FixedPoint.uq112x112;
    using FixedPoint for FixedPoint.uq144x112;

    uint256 public constant PERIOD = 24 hours;

    IUniswapV2Pair immutable pair;
    address public immutable token0;
    address public immutable token1;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint32 public blockTimestampLast;
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    event Updated(
        uint256 price0,
        uint256 price1,
        uint112 reserve0,
        uint112 reserve1
    );

    constructor(address factory, address tokenA, address tokenB) {
        IUniswapV2Pair _pair = IUniswapV2Pair(HelixLibrary.pairFor(factory, tokenA, tokenB));
        pair = _pair;
        token0 = _pair.token0();
        token1 = _pair.token1();
        price0CumulativeLast = _pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)
        price1CumulativeLast = _pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
   }

    function update() external {
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, "Oracle: NO RESERVES IN PAIR"); // ensure that there's liquidity in the pair
 
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update
        if (timeElapsed >= PERIOD) {
            // overflow is desired, casting never truncates
            // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
            price0Average = FixedPoint.uq112x112(uint224((price0Cumulative - price0CumulativeLast) / timeElapsed));
            price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - price1CumulativeLast) / timeElapsed));

            price0CumulativeLast = price0Cumulative;
            price1CumulativeLast = price1Cumulative;
            blockTimestampLast = blockTimestamp;
        }

        emit Updated(
            price0Cumulative,
            price1Cumulative,
            reserve0,
            reserve1
        );
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address token, uint256 amountIn) external view returns (uint256 amountOut) {
        if (token == token0) {
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            require(token == token1, "Oracle: INVALID_TOKEN");
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }
}
