// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../libraries/AuraLibrary.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@rari-capital/solmate/src/utils/ReentrancyGuard.sol';

contract SwapFeeReward is Ownable, ReentrancyGuard {
    address factory;
    address router;
    address targetToken;
    address targetAuraNFT;

    struct PairsList {
        address pair;
        bool enabled;
    }

    PairsList[] pairsList;

    mapping(address => uint) pairOfPid;

    constructor(
        address _factory,
        address _router, 
        address _targetToken,
        address _targetAuraNFT
    ) {
        require(
            _factory != address(0)
            && _router != address(0)
            && _targetToken != address(0)
            && _targetAuraNFT != address(0),
            "Address cannot be zero."
        );
        factory = _factory;
        router = _router;
        targetToken = _targetToken;
        targetAuraNFT = _targetAuraNFT;
    }

    /**
     * @return _pairExists which is true if the token pair of `a` and `b` exists
     *         and false otherwise.
     */
    function pairExists(address a, address b) public view returns(bool _pairExists) {
        address pair = AuraLibrary.pairFor(factory, a, b);
        PairsList storage pool = pairsList[pairOfPid[pair]];
        _pairExists = (pool.pair == pair);
    }
}
