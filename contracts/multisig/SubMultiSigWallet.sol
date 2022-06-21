// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

/// Adapted from https://solidity-by-example.org/app/multi-sig-wallet

import "./MultiSigWallet.sol";

/// Requires master approval before executing transactions
contract SubMultiSigWallet is MultiSigWallet {
    error NotMasterConfirmed(uint256 txIndex);

    modifier onlyMasterConfirmed(uint256 _txIndex) {
        if (!masterHasConfirmed(_txIndex)) revert NotMasterConfirmed(_txIndex);
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) 
        MultiSigWallet(_owners, _numConfirmationsRequired) {
    }

    function masterHasConfirmed(uint256 _txIndex) public view returns (bool) {
        return isConfirmed[_txIndex][owners[0]];
    }

    function getMaster() external view returns (address) {
        return owners[0];
    }

    function executeTransaction(uint _txIndex)
        public
        override
        onlyOwner
        onlyMasterConfirmed(_txIndex)
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        uint256 numConfirmations = transaction.numConfirmations;
        if (numConfirmations < numConfirmationsRequired) {
            revert InsufficientNumConfirmations(numConfirmations, numConfirmationsRequired);
        }

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        if (!success) revert TxFailed(_txIndex);

        emit ExecuteTransaction(msg.sender, _txIndex);
    }
}
