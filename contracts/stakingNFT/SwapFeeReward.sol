// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../libraries/AuraLibrary.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@rari-capital/solmate/src/utils/ReentrancyGuard.sol';
import '@rari-capital/solmate/src/tokens/ERC20.sol';

interface ISwapFactory {}
interface ISwapPair {
    function swapFee() external view returns (uint32);
}
interface IAuraToken {}
interface IAuraNFT {}

contract SwapFeeReward is Ownable, ReentrancyGuard {
    address factory;
    address router;
    bytes32 CODE_HASH;
    IAuraToken auraToken;
    IAuraNFT auraNFT;
    // TODO - Add an oracle 
    address targetToken;
    address targetAuraNFT;

    constructor(
        address _factory,
        address _router, 
        bytes32 _CODE_HASH,
        IAuraToken _auraToken,
        IAuraNFT _auraNFT,
        // TODO - Add an oracle 
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
        CODE_HASH = _CODE_HASH;
        auraToken = _auraToken;
        auraNFT = _auraNFT;
        // TODO - assign oracle
        targetToken = _targetToken;
        targetAuraNFT = _targetAuraNFT;
    }

    /*
    function pairExists(address a, address b) public view returns(bool _pairExists) {
        address pair = hashPair(a, b);
        PairsList storage pool = pairsList[pairOfPid[pair]]);
        _pairExists = (pool.pair == pair);
    }
    */
}
