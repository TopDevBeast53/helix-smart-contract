// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@rari-capital/solmate/src/tokens/ERC20.sol";

contract GeometryLP is ERC20 {
    constructor () ERC20(/*name=*/'Geometry LPs', /*symbol=*/'GEOM-LP', /*decimals=*/18) {}
}