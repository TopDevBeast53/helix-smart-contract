// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IAuraFactory {
    function getExchange(address) external view returns(address);
}
