// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import "../libraries/Percent.sol";
import "../fees/FeeCollector.sol";
import "../interfaces/IFeeMinter.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

/// Thrown when no deposit has been made
error NoDepositMade();

/// Thrown when depositId is invalid
error InvalidDepositId(uint256 depositId);

/// Thrown when index is out of bounds
error IndexOutOfBounds(uint256 index, uint256 length);

/// Thrown when duration is zero
error ZeroDuration();

/// Thrown when weight is zero
error ZeroWeight();

/// Thrown when amount is zero
error ZeroAmount();

/// Thrown when token decimals exceed the max valid decimals
error DecimalsNotLessThanMax(uint256 decimals, uint256 max);

/// Thrown when withdraw amount exceeds balance
error AmountExceedsBalance(uint256 amount, uint256 balance);

/// Thrown when withdraw is still locked until timestamp
error WaitUntil(uint256 timestamp);

/// Thrown when amount is greater than max allowed
error AmountIsGreaterThanMax(uint256 amount, uint256 max);

/// Thrown when amount is less than min allowed
error AmountIsLessThanMin(uint256 amount, uint256 min);

/// Thrown when the from block is greater than the to block
error FromGreaterThanTo(uint256 from, uint256 to);

/// Thrown when caller is not the depositor
error CallerIsNotDepositor(address caller, address depositor);

/// Thrown when deposit is already withdrawn
error Withdrawn();

contract HelixVault is 
    FeeCollector, 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    struct Deposit {
        address depositor;                  // user making the deposit
        uint256 amount;                     // amount of token deposited
        uint256 weight;                     // reward weight by duration 
        uint256 depositTimestamp;           // when the deposit was made and used for calculating rewards
        uint256 withdrawTimestamp;          // when the deposit is eligible for withdrawal
        uint256 rewardDebt;                 // debt owed on this deposit
        bool withdrawn;                     // true if the deposit has been withdrawn and false otherwise
    }
    
    struct Duration {
        uint256 duration;                   // length of time a deposit will be locked in seconds, 1 day == 86400
        uint256 weight;                     // reward modifier for locking a deposit for `duration`
    }
   
    /// Maps depositIds to a Deposit
    mapping(uint256 => Deposit) public deposits;

    /// Maps user addresses to the depositIds made by that address
    /// Used to display to users their deposits
    mapping(address => uint[]) public depositIds;

    /// Owner-curated list of valid deposit durations and associated reward weights
    Duration[] public durations;

    /// Address of the fee minter used by this contract
    IFeeMinter public feeMinter;

    /// Last block that update was called and token distribution occured
    uint256 public lastUpdateBlock;

    /// Accumulated `token`s per share, times PRECISION_FACTOR.
    uint256 public accTokenPerShare;

    /// Used to index deposits for storage and retrieval
    uint256 public depositId;    

    /// Token deposited into and withdrawn from the vault by users
    /// and the token rewarded by the vault to user for locked token deposits
    HelixToken public token;

    /// Last block after which new rewards will no longer be minted
    uint256 public lastRewardBlock;
   
    /// Used for computing rewards
    uint256 public PRECISION_FACTOR;

    /// Sets an upper limit on the number of decimals a token can have
    uint256 public constant MAX_DECIMALS = 30;

    // Emitted when a user makes a new deposit
    event NewDeposit(
        address indexed user, 
        uint256 indexed depositId, 
        uint256 amount, 
        uint256 weight, 
        uint256 depositTimestamp,
        uint256 withdrawTimestamp
    );

    // Emitted when a user updates an existing deposit
    event UpdateDeposit(
        address indexed user, 
        uint256 indexed depositId, 
        uint256 amount,            // amount added to existing deposit
        uint256 balance            // total balance deposited
    );

    // Emitted when a user withdraws a deposit
    event Withdraw(address indexed user, uint256 amount);

    // Emitted if the owner makes an emergency withdrawal
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    // Emitted when a user claims their accrued rewards
    event RewardClaimed(address indexed user, uint256 indexed depositId, uint256 reward);

    // Emitted when any action updates the pool
    event PoolUpdated(uint256 updateTimestamp);

    // Emitted when the owner updates the last reward block
    event LastRewardBlockSet(uint256 lastRewardBlock);

    // Emitted when a new feeMinter is set
    event SetFeeMinter(address indexed setter, address indexed feeMinter);

    // Emitted when a deposit is compounded
    event Compound(
        address indexed depositor, 
        uint256 indexed depositId, 
        uint256 amount, 
        uint256 reward
    );
    
    modifier onlyValidDepositId(uint256 _depositId) {
        if (depositId == 0) revert NoDepositMade();
        if (_depositId >= depositId) revert InvalidDepositId(_depositId);
        _;
    }

    modifier onlyValidIndex(uint256 _index) {
        if (_index >= durations.length) revert IndexOutOfBounds(_index, durations.length);
        _;
    }

    modifier onlyValidDuration(uint256 _duration) {
        if (_duration == 0) revert ZeroDuration();
        _;
    }

    modifier onlyValidWeight(uint256 _weight) {
        if (_weight == 0) revert ZeroWeight();
        _;
    }

    modifier onlyValidAmount(uint256 _amount) {
        if (_amount == 0) revert ZeroAmount();
        _;
    }

    function initialize(
        HelixToken _token,
        address _feeHandler,
        address _feeMinter,
        uint256 _startBlock,
        uint256 _lastRewardBlock
    ) external initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _setFeeHandler(_feeHandler);
        feeMinter = IFeeMinter(_feeMinter);

        token = _token;

        lastRewardBlock = _lastRewardBlock;
        lastUpdateBlock = block.number > _startBlock ? block.number : _startBlock;

        // default locked deposit durations and their weights
        durations.push(Duration(90 days, 5));
        durations.push(Duration(180 days, 10));
        durations.push(Duration(360 days, 30));
        durations.push(Duration(540 days, 50));
        durations.push(Duration(720 days, 100));
                                
        uint256 decimalsRewardToken = uint(token.decimals());
        if (decimalsRewardToken >= MAX_DECIMALS) {
            revert DecimalsNotLessThanMax(decimalsRewardToken, MAX_DECIMALS);
        }

        PRECISION_FACTOR = uint(10 ** (uint(MAX_DECIMALS) - decimalsRewardToken));
    }

    /// Create a new deposit and lock _amount of token for duration _index
    function newDeposit(uint256 _amount, uint256 _index) 
        external 
        whenNotPaused
        nonReentrant
        onlyValidAmount(_amount) 
        onlyValidIndex(_index) 
    {
        updatePool();

        // Get the new id of this deposit and create the deposit object
        uint256 _depositId = depositId++;

        Deposit storage deposit = deposits[_depositId];
        deposit.depositor = msg.sender;
        deposit.amount = _amount;
        deposit.weight = durations[_index].weight;
        deposit.depositTimestamp = block.timestamp;
        deposit.withdrawTimestamp = block.timestamp + durations[_index].duration;
        deposit.rewardDebt = _getReward(deposit.amount, deposit.weight);
        deposit.withdrawn = false;

        // Relay the deposit id to the user's account
        depositIds[msg.sender].push(_depositId);

        TransferHelper.safeTransferFrom(address(token), msg.sender, address(this), _amount);

        emit NewDeposit(
            msg.sender, 
            _depositId, 
            _amount, 
            deposit.weight, 
            deposit.depositTimestamp, 
            deposit.withdrawTimestamp
        );
    }

    /// Increase _depositId by _amount of token
    function updateDeposit(uint256 _amount, uint256 _depositId) 
        external 
        whenNotPaused
        nonReentrant
        onlyValidAmount(_amount) 
        onlyValidDepositId(_depositId)
    {
        updatePool();

        Deposit storage deposit = _getDeposit(_depositId);
    
        _requireIsDepositor(msg.sender, deposit.depositor);
        _requireNotWithdrawn(deposit.withdrawn);

        uint256 reward = _getReward(deposit.amount, deposit.weight) - deposit.rewardDebt;
        deposit.amount += _amount;
        deposit.rewardDebt = _getReward(deposit.amount, deposit.weight);

        _distributeReward(reward);
        TransferHelper.safeTransferFrom(address(token), msg.sender, address(this), _amount);

        emit UpdateDeposit(msg.sender, _depositId, _amount, deposit.amount);
    }

    /// Compound accrued rewards on _depositId and pay collector fees
    function compound(uint256 _depositId) external {
        updatePool();

        Deposit storage deposit = _getDeposit(_depositId);

        _requireIsDepositor(msg.sender, deposit.depositor);
        _requireNotWithdrawn(deposit.withdrawn);
    
        uint256 reward = _getReward(deposit.amount, deposit.weight) - deposit.rewardDebt;
        (uint256 collectorFee, uint256 depositorAmount) = getCollectorFeeSplit(reward);

        deposit.amount += depositorAmount;
        deposit.rewardDebt = _getReward(deposit.amount, deposit.weight);

        if (collectorFee > 0) {
            _delegateTransfer(token, address(this), collectorFee);
        }

        emit Compound(msg.sender, _depositId, deposit.amount, deposit.rewardDebt);
    }

    /// Claim accrued rewards on _depositId
    function claimReward(uint256 _depositId) external whenNotPaused nonReentrant {
        Deposit storage deposit = _getDeposit(_depositId);

        _requireIsDepositor(msg.sender, deposit.depositor);
        _requireNotWithdrawn(deposit.withdrawn);

        updatePool();

        uint256 reward = _getReward(deposit.amount, deposit.weight) - deposit.rewardDebt;
        deposit.rewardDebt = _getReward(deposit.amount, deposit.weight);

        _distributeReward(reward);

        emit RewardClaimed(msg.sender, _depositId, reward);
    }

    /// Withdraw _amount of token from _depositId
    function withdraw(uint256 _amount, uint256 _depositId) external whenNotPaused nonReentrant onlyValidAmount(_amount) {
        Deposit storage deposit = _getDeposit(_depositId);
    
        _requireIsDepositor(msg.sender, deposit.depositor); 
        _requireNotWithdrawn(deposit.withdrawn);
        if (_amount > deposit.amount) revert AmountExceedsBalance(_amount, deposit.amount);
        if (block.timestamp < deposit.withdrawTimestamp) revert WaitUntil(deposit.withdrawTimestamp);
       
        updatePool();
        
        uint256 reward = _getReward(deposit.amount, deposit.weight) - deposit.rewardDebt;

        if (deposit.amount == _amount) {
            // Close the deposit if the amount deposited is being withdrawn
            deposit.withdrawn = true;
            deposit.amount = 0;
            deposit.rewardDebt = 0;
        } else {
            deposit.amount -= _amount;
            deposit.rewardDebt = _getReward(deposit.amount, deposit.weight);
        }

        _distributeReward(reward);

        // Return the original deposit to the depositor
        TransferHelper.safeTransfer(address(token), msg.sender, _amount);

        emit Withdraw(msg.sender, _amount);
    }

    /// Withdraw all the tokens in this contract. Emergency ONLY
    function emergencyWithdraw() external onlyOwner {
        TransferHelper.safeTransfer(address(token), msg.sender, token.balanceOf(address(this)));
    }
    
    /// Called by the owner to get a duration by it's _index and assign it a 
    /// new _duration and _weight
    function setDuration(uint256 _index, uint256 _duration, uint256 _weight)
        external
        onlyOwner
        onlyValidIndex(_index)
        onlyValidDuration(_duration)
        onlyValidWeight(_weight)  
    {
        durations[_index].duration = _duration;
        durations[_index].weight = _weight;
    }
   
    /// Called by the owner to add a new duration with _duration and _weight
    function addDuration(uint256 _duration, uint256 _weight) 
        external 
        onlyOwner
        onlyValidDuration(_duration) 
        onlyValidWeight(_weight)
    {
        durations.push(Duration(_duration, _weight));
    }

    /// Called by the owner to remove the duration at _index
    function removeDuration(uint256 _index) 
        external 
        onlyOwner
        onlyValidIndex(_index)
    {
        // remove by array shift to preserve order
        uint256 length = durations.length - 1;
        for (uint256 i = _index; i < length; i++) {
            durations[i] = durations[i + 1];
        }
        durations.pop();
    }

    /// Called by the owner to set the lastRewardBlock variable
    function setLastRewardBlock(uint256 _lastRewardBlock) external onlyOwner {
        lastRewardBlock = _lastRewardBlock;
        emit LastRewardBlockSet(_lastRewardBlock);
    }

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Called by the owner to set the _feeHandler address
    function setFeeHandler(address _feeHandler) external onlyOwner {
        _setFeeHandler(_feeHandler);
    }

    /// Called by the owner to set the _feeMinter
    function setFeeMinter(address _feeMinter) external onlyOwner {
        feeMinter = IFeeMinter(_feeMinter);
        emit SetFeeMinter(msg.sender, _feeMinter);
    }

    /// Called by the owner to set the _collectorPercent
    function setCollectorPercent(uint256 _collectorPercent) external onlyOwner {
        _setCollectorPercent(_collectorPercent);
    }

    /// Called to get _depositId's pending reward
    function pendingReward(uint256 _depositId) external view returns (uint) {
        Deposit storage deposit = _getDeposit(_depositId);
        
        _requireIsDepositor(msg.sender, deposit.depositor);
        _requireNotWithdrawn(deposit.withdrawn);

        uint256 _accTokenPerShare = accTokenPerShare;
        uint256 balance = token.balanceOf(address(this));
        if (block.number > lastUpdateBlock && balance != 0) {
            uint256 blocks = getBlocksDifference(lastUpdateBlock, block.number);
            _accTokenPerShare += blocks * _getToMintPerBlock() * PRECISION_FACTOR / balance;
        }

        return _getReward(deposit.amount, deposit.weight, _accTokenPerShare) - deposit.rewardDebt;
    }

    // Get the _user's deposit ids which are used for accessing their deposits
    function getDepositIds(address _user) external view returns (uint[] memory) {
        return depositIds[_user];
    }

    /// Get the array of durations
    function getDurations() external view returns (Duration[] memory) {
        return durations;
    }

    /// Return the Deposit associated with _depositId
    function getDeposit(uint256 _depositId) external view returns (Deposit memory) {
        return _getDeposit(_depositId);
    }

    /// Return the rewardPerBlock assigned to this contract
    function getToMintPerBlock() external view returns (uint256) {
        return _getToMintPerBlock();
    }

    /// Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.number <= lastUpdateBlock) {
            return;
        }

        uint256 toMint;
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            uint256 blocks = getBlocksDifference(lastUpdateBlock, block.number);
            toMint = blocks * _getToMintPerBlock();
            accTokenPerShare += toMint * PRECISION_FACTOR / balance;
        }

        lastUpdateBlock = block.number;

        if (toMint > 0) {
            token.mint(address(this), toMint);
        }

        emit PoolUpdated(lastUpdateBlock);
    }

    /// Return the number of blocks between _to and _from blocks
    function getBlocksDifference(uint256 _from, uint256 _to) public view returns (uint) {
        if (_from > _to) revert FromGreaterThanTo(_from, _to);
        if (_from > lastRewardBlock) {
            return 0;
        }
        return Math.min(_to, lastRewardBlock) - _from;
    }

    // Split the _reward into the amount received by the depositor and the amount
    // charged by the treasury
    function _distributeReward(uint256 _reward) private {
        (uint256 collectorFee, uint256 depositorAmount) = getCollectorFeeSplit(_reward);
        if (depositorAmount > 0) {
            TransferHelper.safeTransfer(address(token), msg.sender, depositorAmount);
        }
        if (collectorFee > 0) {
            _delegateTransfer(token, address(this), collectorFee);
        }
    }

    // Return the Deposit associated with _depositId
    function _getDeposit(uint256 _depositId) private view onlyValidDepositId(_depositId) 
        returns (Deposit storage) 
    {
        return deposits[_depositId];
    }

    // Used internally for computing reward and reward debts
    function _getReward(uint256 _amount, uint256 _weight) 
        private 
        view 
        returns (uint256 reward) 
    {
        reward = _getReward(_amount, _weight, accTokenPerShare);
    }

    // Used internally for computing reward and reward debts
    function _getReward(uint256 _amount, uint256 _weight, uint256 _accTokenPerShare) 
        private 
        view 
        returns (uint256 reward) 
    {   
        uint256 accToken = _amount * _accTokenPerShare / PRECISION_FACTOR;
        reward = Percent.getPercentage(accToken, _weight);
    }

    // Return the rewardPerBlock assigned to this contract
    function _getToMintPerBlock() private view returns (uint256) {
        require(address(feeMinter) != address(0), "Vault: fee minter unassigned");
        return feeMinter.getToMintPerBlock(address(this));
    }

    // Used to require that the _caller is the _depositor
    function _requireIsDepositor(address _caller, address _depositor) private pure {
        if (_caller != _depositor) revert CallerIsNotDepositor(_caller, _depositor);
    }
    
    // Used to require that the deposit is not _withdrawn
    function _requireNotWithdrawn(bool _withdrawn) private pure {
        if (_withdrawn) revert Withdrawn();
    }
}
