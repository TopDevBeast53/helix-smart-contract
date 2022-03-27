//SPDX-License-Identifier:MIT
pragma solidity >=0.8.0;

import '../tokens/HelixLP.sol';

contract ERC20LP is HelixLP {
    constructor(uint _totalSupply) {
        _mint(msg.sender, _totalSupply);
    }
}