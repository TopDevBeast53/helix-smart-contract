// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IAuraMigrator {
    function migrate(address token, address to, uint tokenMinAmount, uint ethMinAmount, uint deadline) external;
}
