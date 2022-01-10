// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@rari-capital/solmate/src/tokens/ERC20.sol";

contract AuraLP is ERC20 {
    constructor () ERC20(/*name=*/'Aura LPs', /*symbol=*/'AURA-LP', /*decimals=*/18) {}
}