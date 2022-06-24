// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

/// Adapted from https://solidity-by-example.org/app/multi-sig-wallet

/// Multisig controlled by 2 groups: admins and owners. 
/// Admins can add and remove admins and owners and set the confirmations required from each.
/// Some number of confirmations are required from both admins and owners for transactions
/// to be executed.
contract AdminMultiSigWallet {
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event OwnerConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event AdminConfirmTransaction(address indexed admin, uint256 indexed txIndex);
    event OwnerRevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event AdminRevokeConfirmation(address indexed admin, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event AddAdmin(address indexed caller, address indexed admin);
    event AddOwner(address indexed caller, address indexed owner);
    event RemoveAdmin(address indexed caller, address indexed admin);
    event RemoveOwner(address indexed caller, address indexed owner);
    event SetNumAdminConfirmationsRequired(
        address indexed caller, 
        uint256 indexed numAdminConfirmationsRequired
    );
    event SetNumOwnerConfirmationsRequired(
        address indexed caller, 
        uint256 indexed numOwnerConfirmationsRequired
    );
 
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numAdminConfirmations;
        uint256 numOwnerConfirmations;
    }
    Transaction[] public transactions;

    address[] public admins;
    mapping(address => bool) public isAdmin;
    uint256 public numAdminConfirmationsRequired;

    // mapping from tx index => admin => true if admin has confirmed and false otherwise
    mapping(uint256 => mapping(address => bool)) public isAdminConfirmed;

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numOwnerConfirmationsRequired;

    // mapping from tx index => owner => true if owner has confirmed and false otherwise
    mapping(uint256 => mapping(address => bool)) public isOwnerConfirmed;

    error NotAnAdmin(address caller);
    error NotAnOwner(address caller);
    error TxDoesNotExist(uint256 txIndex);
    error TxAlreadyExecuted(uint256 txIndex);
    error TxAlreadyConfirmed(uint256 txIndex);
    error OwnersAreRequired();
    error InvalidNumOwnerConfirmationsRequired(uint256 numRequired);
    error InvalidNumAdminConfirmationsRequired(uint256 numRequired);
    error ZeroAddress();
    error AlreadyAnOwner(address owner);
    error AlreadyAnAdmin(address admin);
    error TxFailed(uint256 txIndex);
    error InsufficientNumOwnerConfirmations(uint256 numOwnerConfirmations, uint256 numRequired);
    error InsufficientNumAdminConfirmations(uint256 numOwnerConfirmations, uint256 numRequired);
    error TxNotConfirmed(uint256 txIndex, address owner);
    error OwnerCantBeAdmin(address owner);
    error AdminCantBeOwner(address admin);
    error NotAnOwnerOrAdmin(address caller);
    error OwnersLengthWouldBeBelowNumOwnerConfirmationsRequired(
        uint256 ownersLength, 
        uint256 numOwnerConfirmationsRequired
    );
    error AdminsLengthWouldBeBelowNumOwnerConfirmationsRequired(
        uint256 adminsLength, 
        uint256 numOwnerConfirmationsRequired
    );

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotAnOwner(msg.sender);
        _;
    }

    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) revert NotAnAdmin(msg.sender);
        _;
    }

    modifier onlyAdminOrOwner() {
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

    modifier notOwnerConfirmed(uint256 _txIndex) {
        if (isOwnerConfirmed[_txIndex][msg.sender]) revert TxAlreadyConfirmed(_txIndex);
        _;
    }

    modifier notAdminConfirmed(uint256 _txIndex) {
        if (isAdminConfirmed[_txIndex][msg.sender]) revert TxAlreadyConfirmed(_txIndex);
        _;
    }

    /// If _admins is empty the setters in this contract will not be callable
    constructor(
        address[] memory _admins,
        address[] memory _owners,
        uint256 _numAdminConfirmationsRequired,
        uint256 _numOwnerConfirmationsRequired
    ) {
        if (_owners.length == 0) revert OwnersAreRequired();
        if (_numAdminConfirmationsRequired > _admins.length) {
            revert InvalidNumAdminConfirmationsRequired(_numAdminConfirmationsRequired);
        }
        if (_numOwnerConfirmationsRequired == 0 || _numOwnerConfirmationsRequired > _owners.length) {
            revert InvalidNumOwnerConfirmationsRequired(_numOwnerConfirmationsRequired);
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
        numOwnerConfirmationsRequired = _numOwnerConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) 
        public 
        onlyAdminOrOwner 
    {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numAdminConfirmations: 0,
                numOwnerConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(uint256 _txIndex)
        public
        onlyAdminOrOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        if (isAdmin[msg.sender]) {
            _adminConfirmTransaction(_txIndex);
        } else {
            _ownerConfirmTransaction(_txIndex);
        }
    }

    function revokeConfirmation(uint256 _txIndex)
        public
        onlyAdminOrOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        if (isAdmin[msg.sender]) {
            _revokeAdminConfirmation(_txIndex);
        } else {
            _revokeOwnerConfirmation(_txIndex);
        }
    }

    function executeTransaction(uint256 _txIndex)
        public
        virtual
        onlyAdminOrOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        uint256 numAdminConfirmations = transaction.numAdminConfirmations;
        if (numAdminConfirmations < numAdminConfirmationsRequired) {
            revert InsufficientNumAdminConfirmations(numAdminConfirmations, numAdminConfirmationsRequired);
        }

        uint256 numOwnerConfirmations = transaction.numOwnerConfirmations;
        if (numOwnerConfirmations < numOwnerConfirmationsRequired) {
            revert InsufficientNumOwnerConfirmations(numOwnerConfirmations, numOwnerConfirmationsRequired);
        }

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        if (!success) revert TxFailed(_txIndex);

        emit ExecuteTransaction(msg.sender, _txIndex);
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

    function setNumOwnerConfirmationsRequired(uint256 _numOwnerConfirmationsRequired) external onlyAdmin {
        bytes memory data = abi.encodeWithSignature(
            "_setNumOwnerConfirmationsRequired(uint256)", 
            _numOwnerConfirmationsRequired
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
        if (isOwner[_owner]) revert AlreadyAnOwner(_owner);
        if (isAdmin[_owner]) revert OwnerCantBeAdmin(_owner);
        isOwner[_owner] = true;
        owners.push(_owner);
        emit AddOwner(msg.sender, _owner);
    }

    /// Add _admin as an admin 
    function _addAdmin(address _admin) private {
        if (isAdmin[_admin]) revert AlreadyAnAdmin(_admin);
        if (isOwner[_admin]) revert AdminCantBeOwner(_admin);
        isAdmin[_admin] = true;
        admins.push(_admin);
        emit AddAdmin(msg.sender, _admin);
    }

    /// Remove _owner from being an owner
    function _removeOwner(address _owner) private {
        if (!isOwner[_owner]) revert NotAnOwner(_owner);
        uint256 ownersLength;
        if (ownersLength - 1 < numOwnerConfirmationsRequired) {
            revert OwnersLengthWouldBeBelowNumOwnerConfirmationsRequired(
                ownersLength, 
                numOwnerConfirmationsRequired
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
            revert AdminsLengthWouldBeBelowNumOwnerConfirmationsRequired(
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

    /// Set the _numOwnerConfirmationsRequired for transactions be be executed
    function _setNumOwnerConfirmationsRequired(uint256 _numOwnerConfirmationsRequired) private {
        if (_numOwnerConfirmationsRequired == 0 || _numOwnerConfirmationsRequired > owners.length) {
            revert InvalidNumOwnerConfirmationsRequired(_numOwnerConfirmationsRequired);
        }

        numOwnerConfirmationsRequired = _numOwnerConfirmationsRequired;
        emit SetNumOwnerConfirmationsRequired(msg.sender, _numOwnerConfirmationsRequired);
    }

    /// Set the _numOwnerConfirmationsRequired for transactions be be executed
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
            uint256 numOwnerConfirmations,
            uint256 numAdminConfirmations
        )
    {
        Transaction memory transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numOwnerConfirmations,
            transaction.numAdminConfirmations
        );
    }

    function _ownerConfirmTransaction(uint256 _txIndex) private notOwnerConfirmed(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numOwnerConfirmations += 1;
        isOwnerConfirmed[_txIndex][msg.sender] = true;

        emit OwnerConfirmTransaction(msg.sender, _txIndex);
    }

    function _adminConfirmTransaction(uint256 _txIndex) private notAdminConfirmed(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numAdminConfirmations += 1;
        isAdminConfirmed[_txIndex][msg.sender] = true;

        emit AdminConfirmTransaction(msg.sender, _txIndex);
    }

    function _revokeOwnerConfirmation(uint256 _txIndex) private {
        Transaction storage transaction = transactions[_txIndex];

        if (!isOwnerConfirmed[_txIndex][msg.sender]) revert TxNotConfirmed(_txIndex, msg.sender);

        transaction.numOwnerConfirmations -= 1;
        isOwnerConfirmed[_txIndex][msg.sender] = false;

        emit OwnerRevokeConfirmation(msg.sender, _txIndex);
    }

    function _revokeAdminConfirmation(uint256 _txIndex) private {
        Transaction storage transaction = transactions[_txIndex];

        if (!isAdminConfirmed[_txIndex][msg.sender]) revert TxNotConfirmed(_txIndex, msg.sender);

        transaction.numOwnerConfirmations -= 1;
        isAdminConfirmed[_txIndex][msg.sender] = false;

        emit AdminRevokeConfirmation(msg.sender, _txIndex);
    }
}
