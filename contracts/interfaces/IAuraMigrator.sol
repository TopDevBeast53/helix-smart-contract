// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IAuraMigrator {
    function migrateLiquidity(address tokenA, address tokenB, address lpToken, address externalRouter) external payable returns(bool);
}
