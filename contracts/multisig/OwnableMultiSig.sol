// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

abstract contract OwnableMultiSig {
    error CallerIsNotMultiSigOwner();
    error ZeroMultiSigOwnerAddress();

    address private _multiSigOwner;

    event MultiSigOwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferMultiSigOwnership(msg.sender);
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
        if (msg.sender != multiSigOwner()) revert CallerIsNotMultiSigOwner();
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
        if (newOwner == address(0)) revert ZeroMultiSigOwnerAddress();
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
}
