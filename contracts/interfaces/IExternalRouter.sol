// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface IExternalRouter {
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns(uint amountA, uint amountB);
}
