// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@rari-capital/solmate/src/utils/ReentrancyGuard.sol';
import '@rari-capital/solmate/src/tokens/ERC20.sol';

interface ISwapFactory {}
interface ISwapPair {}
interface IAuraToken {}
interface IAuraNFT {}

contract SwapFeeReward is Ownable, ReentrancyGuard {
    address factory;
    address router;
    bytes CODE_HASH;
    IAuraToken auraToken;
    IAuraNFT auraNFT;
    // TODO - Add an oracle 
    address targetToken;
    address targetAuraNFT;

    constructor(
        address _factory,
        address _router, 
        bytes _CODE_HASH,
        IAuraToken _auraToken,
        IAuraNFT _auraNFT,
        // TODO - Add an oracle 
        address _targetToken,
        address _targetAuraNFT
    ) public {
        require(
            _factory != address(0)
            && _router != address(0)
            && _targetToken != address(0)
            && _targetAuraNFT != address(0),
            "Address cannot be zero."
        );
        factory = _factory,
        router = _router,
        CODE_HASH = _CODE_HASH,
        auraToken = _auraToken,
        auraNFT = _auraNFT;
        // TODO - assign oracle
        targetToken = _targetToken;
        targetAuraNFT = _targetAuraNFT;
    }

    /**
     * @return the addresses `a` and `b` sorted in ascending order.
     */
    function sortAddresses(address a, address b) public pure returns(address c, address d) {
        require(a != b, "Addresses are identical.");
        (c, d) = (a < b) ? (a, b) : (b, a);
        require(c != address(0), "The 0 address is invalid.");
    }

    /**
     * @return the pair of addresses `a` and `b` as a single hashed address.
     */
    function hashPair(address a, address b) public view returns(address hashed) {
        // Sort first to establish consistency across calls since hashing (a, b) != (b, a).
        (address c, address d) = sortAddresses(a, b);
        hashed = address(uint(keccak256(abi.encodePacked(
                hex"ff",
                factory,
                keccack256(abi.encodePacked(c, d)),
                CODE_HASH
            ))));
    }
}
