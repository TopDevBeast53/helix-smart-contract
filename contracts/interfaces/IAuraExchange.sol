// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IAuraExchange {
    function liquidityOf(address account) external view returns(uint);
    function transferFrom(address from, address to, uint value) external returns(bool);
    function removeLiquidity(uint, uint, uint, uint) external returns(uint, uint);
    function tokenToEthSwap(uint, uint, uint) external returns(uint);
    function ethToTokenSwap(uint, uint) external payable returns(uint);
}
