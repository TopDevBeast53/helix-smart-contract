// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

/**
 * @title This contract only exists to be used as a mock for testing
 *        and is not intended to be implemented. 
 */
contract MockOracle {
    function consult(address tokenIn, uint amountIn, address tokenOut) external view returns(uint amountOut) {
        if (tokenIn == tokenOut) {
            amountOut = amountIn;
        } else {
            amountOut = 0;
        }
    }
}
