// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IHelixCallee {
    function HelixCall(address sender, uint amount0, uint amount1, bytes calldata data) external;
}