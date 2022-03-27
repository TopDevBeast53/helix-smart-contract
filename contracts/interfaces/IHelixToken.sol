// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface IHelixToken {
    function mint(address to, uint amount) external returns(bool);
    function transfer(address recipient, uint amount) external returns(bool);
}
