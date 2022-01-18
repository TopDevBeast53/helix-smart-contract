//SPDX-License-Identifier:MIT
pragma solidity >=0.8.0;

import '../tokens/AuraLP.sol';

contract ERC20LP is AuraLP {
    constructor(uint _totalSupply) {
        _mint(msg.sender, _totalSupply);
    }
}