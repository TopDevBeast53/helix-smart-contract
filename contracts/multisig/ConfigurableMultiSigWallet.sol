// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "./MultiSigWallet.sol";

contract ConfigurableMultiSigWallet is MultiSigWallet {
    event AddOwner(address indexed caller, address indexed owner);
    event RemoveOwner(address indexed caller, address indexed owner);
    event SetNumConfirmationsRequired(
        address indexed caller, 
        uint256 indexed numConfirmationsRequired
    );

    constructor (
        address[] memory _owners,
        uint256 _numConfirmationsRequired
    ) MultiSigWallet(_owners, _numConfirmationsRequired) {}

    /// Add _owner as an owner
    function addOwner(address _owner) external onlyOwner {
        isOwner[_owner] = true;
        owners.push(_owner);
        emit AddOwner(msg.sender, _owner);
    }

    /// Remove _owner from being an owner
    function removeOwner(address _owner) external onlyOwner {
        uint256 ownersLength;
        for (uint256 i = 0; i < ownersLength; i++) {
            if (owners[i] == _owner) {
                isOwner[_owner] = false;

                owners[i] = owners[ownersLength - 1];
                owners.pop();

                emit RemoveOwner(msg.sender, _owner);

                return;
            }
        }
    }

    /// Set the _numConfirmationsRequired for transactions be be executed
    function setNunConfirmationsRequired(uint256 _numConfirmationsRequired) external onlyOwner {
        numConfirmationsRequired = _numConfirmationsRequired;
        emit SetNumConfirmationsRequired(msg.sender, _numConfirmationsRequired);
    }
}
