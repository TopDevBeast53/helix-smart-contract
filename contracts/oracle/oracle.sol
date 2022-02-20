// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '../interfaces/IOracle.sol';

contract Oracle is IOracle {
    function consult(address tokenIn, uint amountIn, address tokenOut) external pure returns(uint amountOut) {
        if (tokenIn == tokenOut) {
            amountOut = amountIn;
        } else {
            amountOut = 0;
        }
    }
}
