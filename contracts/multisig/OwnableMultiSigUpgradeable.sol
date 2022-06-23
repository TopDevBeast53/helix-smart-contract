// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract OwnableMultiSigUpgradeable is Initializable, ContextUpgradeable {
    error CallerIsNotMultiSigOwner();
    error ZeroMultiSigAddress();

    address private _multiSigOwner;

    event MultiSigOwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    function __OwnableMultiSig_init() internal onlyInitializing {
        __OwnableMultiSig_init_unchained();
    }

    function __OwnableMultiSig_init_unchained() internal onlyInitializing {
        _transferMultiSigOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyMultiSig() {
        _checkMultiSigOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function multiSigOwner() public view virtual returns (address) {
        return _multiSigOwner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkMultiSigOwner() internal view virtual {
        if (multiSigOwner() != _msgSender()) revert CallerIsNotMultiSigOwner();
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceMultiSigOwnership() public virtual onlyMultiSig {
        _transferMultiSigOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferMultiSigOwnership(address newOwner) public virtual onlyMultiSig {
        if (newOwner == address(0)) revert ZeroMultiSigAddress();
        _transferMultiSigOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferMultiSigOwnership(address newOwner) internal virtual {
        address oldOwner = _multiSigOwner;
        _multiSigOwner = newOwner;
        emit MultiSigOwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
