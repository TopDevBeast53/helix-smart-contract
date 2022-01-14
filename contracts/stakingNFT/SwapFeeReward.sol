// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

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

    /**
     * @dev returns the token addresses `a` and `b` sorted in ascending order.
     * @return c the smaller of the two token addresses.
     * @return d the larger of the two token addresses. 
     */
    function sortTokens(address a, address b) public pure returns(address c, address d) {
        require(a != b, "Addresses are identical.");
        (c, d) = (a < b) ? (a, b) : (b, a);
        require(c != address(0), "The 0 address is invalid.");
    }

    /**
     * @return hashed pair of addresses `a` and `b` and other data into a single address.
     */
    function hashPair(address a, address b) public view returns(address hashed) {
        // Sort first to establish consistency across calls since hashing (a, b) != (b, a).
        (address c, address d) = sortTokens(a, b);
        // TODO - confirm that converting from uint256 -> uint160 -> address results in acceptable behavior.
        //        It's a work-around since uint256 -> address is not permitted. 
        //        It should be fine as long as the address isn't supposed to point at an 
        //        already existing address.
        hashed = address(uint160(uint(keccak256(abi.encodePacked(
                hex"ff",
                factory,
                keccak256(abi.encodePacked(c, d)),
                CODE_HASH
            )))));
    }

    /**
     * @return swapFee incurred for swapping tokens `a` and `b`.
     */
    function getSwapFee(address a, address b) internal view returns(uint swapFee) {
        swapFee = uint(1000) - ISwapPair(hashPair(a, b)).swapFee();
    }
}
