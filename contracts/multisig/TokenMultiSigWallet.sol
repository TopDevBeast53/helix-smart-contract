// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./MultiSigWallet.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenMultiSigWallet {
    using SafeERC20 for IERC20;

    event NotifyDeposit(
        address indexed caller,
        address indexed token,
        uint256 _amount,
        uint256 _balance
    );
    event SubmitTransfer(
        address indexed owner,
        uint256 indexed transferId,
        address token,
        address to,
        uint256 amount
    );
    event ApproveTransfer(address indexed owner, uint256 indexed transferId);
    event ExecuteTransfer(address indexed owner, uint256 indexed transferId);
    event RevokeApproval(address indexed owner, uint256 indexed transferId);

    // Transfer of amount of token to address to with approvals many approvals
    struct Transfer {
        address token;
        address to;
        uint256 amount;
        uint256 approvals;
        bool executed; 
    }

    Transfer[] public transfers;

    /// Addresses that can submit, approve, and execute transfers
    address[] public owners;

    /// Name assigned to this contract 
    string public name;

    /// Number of approvals required to execute a transaction
    uint256 public requiredApprovals;

    /// True if the address is an owner and false otherwise
    mapping(address => bool) public isOwner;

    /// Maps transferId => owner => true if owner has approved transferId and false otherwise
    mapping(uint256 => mapping(address => bool)) public isApproved;

    error OwnersRequired();
    error InvalidRequiredApprovals(uint256 num, uint256 max);
    error ZeroAddress();
    error OwnerNotUnique(address owner);
    error ZeroTransferAmount();
    error InsufficientBalance(uint256 amount, uint256 balance);
    error NotAnOwner(address caller);
    error TransferDoesNotExist(uint256 transferId);
    error TransferAlreadyApproved(uint256 transferId);
    error TransferAlreadyExecuted(uint256 transferId);
    error InsufficientApprovals(uint256 approvals, uint256 requiredApprovals);
    error TransferNotApproved(address owner, uint256 transferId);

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotAnOwner(msg.sender);
        _;
    }

    modifier transferExists(uint256 _transferId) {
        if (_transferId >= transfers.length) revert TransferDoesNotExist(_transferId);
        _;
    }

    modifier notApproved(uint256 _transferId) {
        if (isApproved[_transferId][msg.sender]) revert TransferAlreadyApproved(_transferId);
        _;
    }

    modifier notExecuted(uint256 _transferId) {
        if (transfers[_transferId].executed) revert TransferAlreadyExecuted(_transferId);
        _;
    }

    constructor (
        address[] memory _owners,
        string memory _name,
        uint256 _requiredApprovals
    ) {
        if (_owners.length == 0) revert OwnersRequired();
        if (_requiredApprovals == 0 || _requiredApprovals > _owners.length) {
            revert InvalidRequiredApprovals(_requiredApprovals, _owners.length);
        }

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            if (owner == address(0)) revert ZeroAddress();
            if (isOwner[owner]) revert OwnerNotUnique(owner);

            isOwner[owner] = true;
            owners.push(owner);
        }

        name = _name;
        requiredApprovals = _requiredApprovals;
    }

    /// Should be called as a courtesy after _amount of _token is sent to this contract
    function notifyDeposit(address _token, uint256 _amount) external {
        emit NotifyDeposit(msg.sender, _token, _amount, getBalance(_token));
    }

    /// Submit request to transfer _amount of _token from contract to _to
    function submitTransfer(address _token, address _to, uint256 _amount) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();
        uint256 balance = getBalance(_token);
        if (_amount == 0) revert ZeroTransferAmount();
        if (_amount > balance) revert InsufficientBalance(_amount, balance);

        uint256 transferId = transfers.length;

        transfers.push(
            Transfer({
                token: _token,
                to: _to,
                amount: _amount,
                approvals: 0,
                executed: false
            })
        );

        emit SubmitTransfer(msg.sender, transferId, _to, _token, _amount);
    }

    /// Approve transfer request on _transferId
    function approveTransfer(uint256 _transferId) 
        external
        onlyOwner
        transferExists(_transferId)
        notApproved(_transferId)
        notExecuted(_transferId)
    {
        Transfer storage transfer = transfers[_transferId];
        transfer.approvals += 1;
        isApproved[_transferId][msg.sender] = true;

        emit ApproveTransfer(msg.sender, _transferId);
    }

    /// Execute the transfer of _transferId
    function executeTransfer(uint256 _transferId)
        external
        onlyOwner
        transferExists(_transferId)
        notExecuted(_transferId)
    {
        Transfer storage transfer = transfers[_transferId];
    
        uint256 approvals = transfer.approvals;
        if (approvals < requiredApprovals) {
            revert InsufficientApprovals(approvals, requiredApprovals);
        }

        // Check again that balance is sufficient since it's possible another transfer 
        // on the same token has been executed, reducing the balance
        uint256 balance = getBalance(transfer.token);
        uint256 amount = transfer.amount;
        if (amount > balance) revert InsufficientBalance(amount, balance);

        transfer.executed = true; 

        IERC20(transfer.token).safeTransfer(transfer.to, amount);

        emit ExecuteTransfer(msg.sender, _transferId);
    }

    /// Revoke approval to transfer _transferId
    function revokeApproval(uint256 _transferId)
        external
        onlyOwner
        transferExists(_transferId)
        notExecuted(_transferId)
    {
        Transfer storage transfer = transfers[_transferId];

        if (!isApproved[_transferId][msg.sender]) {
            revert TransferNotApproved(msg.sender, _transferId);
        }

        transfer.approvals -= 1;
        isApproved[_transferId][msg.sender] = false;

        emit RevokeApproval(msg.sender, _transferId);
    }

    /// Return the list of owners
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
    
    /// Return the list of transfers
    function getTransferCount() external view returns (uint256) {
        return transfers.length;
    }

    /// Return the transfer with _transferId
    function getTransfer(uint256 _transferId)
        external
        view
        transferExists(_transferId)
        returns (
            address token,
            address to,
            uint256 amount,
            uint256 approvals,
            bool executed
        )
    {
        Transfer memory transfer = transfers[_transferId];

        return (
            transfer.token,
            transfer.to,
            transfer.amount,
            transfer.approvals,
            transfer.executed
        );
    }

    /// Return this contract's _token balance
    function getBalance(address _token) public view returns (uint256) {
        if (_token == address(0)) revert ZeroAddress();
        return IERC20(_token).balanceOf(address(this));
    }
}
