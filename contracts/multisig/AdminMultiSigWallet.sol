// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

/// Adapted from https://solidity-by-example.org/app/multi-sig-wallet
/// Multisig controlled by 2 groups: admins and owners. Admins predominately have control and
/// can add and remove admins and owners and set how many confirmations are required from each. 
contract AdminMultiSigWallet {
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event AdminConfirmTransaction(address indexed admin, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event RevokeAdminConfirmation(address indexed admin, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event AddOwner(address indexed caller, address indexed owner);
    event AddAdmin(address indexed caller, address indexed admin);
    event RemoveOwner(address indexed caller, address indexed owner);
    event RemoveAdmin(address indexed caller, address indexed admin);
    event SetNumConfirmationsRequired(
        address indexed caller, 
        uint256 indexed numConfirmationsRequired
    );
    event SetNumAdminConfirmationsRequired(
        address indexed caller, 
        uint256 indexed numAdminConfirmationsRequired
    );

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 numAdminConfirmations;
    }

    address[] public admins;
    mapping(address => bool) public isAdmin;
    uint256 public numAdminConfirmationsRequired;

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;

    // mapping from tx index => owner => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    // mapping from tx index => admin => true if admin has confirmed and false otherwise
    mapping(uint256 => mapping(address => bool)) public isAdminConfirmed;

    Transaction[] public transactions;

    error NotAnAdmin(address caller);
    error NotAnOwner(address caller);
    error TxDoesNotExist(uint256 txIndex);
    error TxAlreadyExecuted(uint256 txIndex);
    error TxAlreadyConfirmed(uint256 txIndex);
    error OwnersAreRequired();
    error AdminsAreRequired();
    error InvalidNumConfirmationsRequired(uint256 numRequired);
    error InvalidNumAdminConfirmationsRequired(uint256 numRequired);
    error ZeroAddress();
    error AlreadyAnOwner(address owner);
    error AlreadyAnAdmin(address admin);
    error TxFailed(uint256 txIndex);
    error InsufficientNumConfirmations(uint256 numConfirmations, uint256 numRequired);
    error InsufficientNumAdminConfirmations(uint256 numConfirmations, uint256 numRequired);
    error TxNotConfirmed(uint256 txIndex, address owner);
    error OwnerCantBeAdmin(address owner);
    error NotAnOwnerOrAdmin(address caller);
    error OwnersLengthWouldBeBelowNumConfirmationsRequired(
        uint256 ownersLength, 
        uint256 numConfirmationsRequired
    );
    error AdminsLengthWouldBeBelowNumConfirmationsRequired(
        uint256 adminsLength, 
        uint256 numConfirmationsRequired
    );

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotAnOwner(msg.sender);
        _;
    }

    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) revert NotAnAdmin(msg.sender);
        _;
    }

    modifier onlyOwnerOrAdmin() {
        if (!isOwner[msg.sender] && !isAdmin[msg.sender]) revert NotAnOwnerOrAdmin(msg.sender);
        _;
    }

    modifier txExists(uint256 _txIndex) {
        if (_txIndex >= transactions.length) revert TxDoesNotExist(_txIndex);
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        if (transactions[_txIndex].executed) revert TxAlreadyExecuted(_txIndex);
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        if (isConfirmed[_txIndex][msg.sender]) revert TxAlreadyConfirmed(_txIndex);
        _;
    }

    modifier notAdminConfirmed(uint256 _txIndex) {
        if (isAdminConfirmed[_txIndex][msg.sender]) revert TxAlreadyConfirmed(_txIndex);
        _;
    }

    constructor(
        address[] memory _admins,
        address[] memory _owners,
        uint256 _numAdminConfirmationsRequired,
        uint256 _numConfirmationsRequired
    ) {
        if (_admins.length == 0) revert AdminsAreRequired();
        if (_owners.length == 0) revert OwnersAreRequired();
        if (_numAdminConfirmationsRequired == 0 || _numAdminConfirmationsRequired > _admins.length) {
            revert InvalidNumAdminConfirmationsRequired(_numAdminConfirmationsRequired);
        }
        if (_numConfirmationsRequired == 0 || _numConfirmationsRequired > _owners.length) {
            revert InvalidNumConfirmationsRequired(_numConfirmationsRequired);
        }

        uint256 adminsLength = _admins.length;
        for (uint256 i = 0; i < adminsLength; i++) {
            address admin = _admins[i];

            if (admin == address(0)) revert ZeroAddress();
            if (isAdmin[admin]) revert AlreadyAnAdmin(admin);

            isAdmin[admin] = true;
            admins.push(admin);
        }

        uint256 ownersLength = _owners.length;
        for (uint256 i = 0; i < ownersLength; i++) {
            address owner = _owners[i];

            if (owner == address(0)) revert ZeroAddress();
            if (isAdmin[owner]) revert OwnerCantBeAdmin(owner);
            if (isOwner[owner]) revert AlreadyAnOwner(owner);

            isOwner[owner] = true;
            owners.push(owner);
        }

        numAdminConfirmationsRequired = _numAdminConfirmationsRequired;
        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwnerOrAdmin {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0,
                numAdminConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function adminConfirmTransaction(uint256 _txIndex)
        public
        onlyAdmin
        txExists(_txIndex)
        notExecuted(_txIndex)
        notAdminConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numAdminConfirmations += 1;
        isAdminConfirmed[_txIndex][msg.sender] = true;

        emit AdminConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex)
        public
        virtual
        onlyOwnerOrAdmin
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        uint256 numAdminConfirmations = transaction.numAdminConfirmations;
        if (numAdminConfirmations < numAdminConfirmationsRequired) {
            revert InsufficientNumAdminConfirmations(numAdminConfirmations, numAdminConfirmationsRequired);
        }

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

    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        if (!isConfirmed[_txIndex][msg.sender]) revert TxNotConfirmed(_txIndex, msg.sender);

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function revokeAdminConfirmation(uint256 _txIndex)
        public
        onlyAdmin
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        if (!isAdminConfirmed[_txIndex][msg.sender]) revert TxNotConfirmed(_txIndex, msg.sender);

        transaction.numConfirmations -= 1;
        isAdminConfirmed[_txIndex][msg.sender] = false;

        emit RevokeAdminConfirmation(msg.sender, _txIndex);
    }

    function addOwner(address _owner) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature("_addOwner(address)", _owner);
        submitTransaction(address(this), 0, data);
    }

    function addAdmin(address _admin) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature("_addAdmin(address)", _admin);
        submitTransaction(address(this), 0, data);
    }

    function removeOwner(address _owner) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature("_removeOwner(address)", _owner);
        submitTransaction(address(this), 0, data);
    }

    function removeAdmin(address _admin) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature("_removeAdmin(address)", _admin);
        submitTransaction(address(this), 0, data);
    }

    function setNumConfirmationsRequired(uint256 _numConfirmationsRequired) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature(
            "_setNumConfirmationsRequired(uint256)", 
            _numConfirmationsRequired
        );
        submitTransaction(address(this), 0, data);
    }

    function setNumAdminConfirmationsRequired(uint256 _numAdminConfirmationsRequired) 
        external 
        onlyAdmin 
    {
        bytes memory data = abi.encodeWithSignature(
            "_setNumAdminConfirmationsRequired(uint256)", 
            _numAdminConfirmationsRequired
        );
        submitTransaction(address(this), 0, data);
    }

    /// Add _owner as an owner
    function _addOwner(address _owner) private {
        if (isAdmin[_owner]) revert OwnerCantBeAdmin(_owner);
        if (isOwner[_owner]) revert AlreadyAnOwner(_owner);
        isOwner[_owner] = true;
        owners.push(_owner);
        emit AddOwner(msg.sender, _owner);
    }

    /// Add _admin as an admin 
    function _addAdmin(address _admin) private {
        if (isAdmin[_admin]) revert AlreadyAnAdmin(_admin);
        if (isOwner[_admin]) revert OwnerCantBeAdmin(_admin);
        isAdmin[_admin] = true;
        admins.push(_admin);
        emit AddAdmin(msg.sender, _admin);
    }

    /// Remove _owner from being an owner
    function _removeOwner(address _owner) private {
        if (!isOwner[_owner]) revert NotAnOwner(_owner);
        uint256 ownersLength;
        if (ownersLength - 1 < numConfirmationsRequired) {
            revert OwnersLengthWouldBeBelowNumConfirmationsRequired(
                ownersLength, 
                numConfirmationsRequired
            );
        }
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

    /// Remove _adminfrom being an admin 
    function _removeAdmin(address _admin) private {
        if (!isAdmin[_admin]) revert NotAnAdmin(_admin);
        uint256 adminsLength;
        if (adminsLength - 1 < numAdminConfirmationsRequired) {
            revert AdminsLengthWouldBeBelowNumConfirmationsRequired(
                adminsLength, 
                numAdminConfirmationsRequired
            );
        }
        for (uint256 i = 0; i < adminsLength; i++) {
            if (admins[i] == _admin) {
                isAdmin[_admin] = false;

                admins[i] = admins[adminsLength - 1];
                admins.pop();

                emit RemoveAdmin(msg.sender, _admin);

                return;
            }
        }
    }

    /// Set the _numConfirmationsRequired for transactions be be executed
    function _setNumConfirmationsRequired(uint256 _numConfirmationsRequired) private {
        if (_numConfirmationsRequired == 0 || _numConfirmationsRequired > owners.length) {
            revert InvalidNumConfirmationsRequired(_numConfirmationsRequired);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
        emit SetNumConfirmationsRequired(msg.sender, _numConfirmationsRequired);
    }

    /// Set the _numConfirmationsRequired for transactions be be executed
    function _setNumAdminConfirmationsRequired(uint256 _numAdminConfirmationsRequired) private {
        if (_numAdminConfirmationsRequired == 0 || _numAdminConfirmationsRequired > admins.length) {
            revert InvalidNumAdminConfirmationsRequired(_numAdminConfirmationsRequired);
        }
 
        numAdminConfirmationsRequired = _numAdminConfirmationsRequired;
        emit SetNumAdminConfirmationsRequired(msg.sender, _numAdminConfirmationsRequired);
    }

    function getAdmins() public view returns (address[] memory) {
        return admins;
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations,
            uint256 numAdminConfirmations
        )
    {
        Transaction memory transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations,
            transaction.numAdminConfirmations
        );
    }
}
