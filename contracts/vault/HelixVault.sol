// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract HelixVault is Ownable {
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

    /// Last block that update was called and token distribution occured
    uint256 public lastUpdateBlock;

    /// Accumulated `token`s per share, times PRECISION_FACTOR.
    uint256 public accTokenPerShare;

    /// Used to index deposits for storage and retrieval
    uint256 public depositId;    

    /// Token deposited into and withdrawn from the vault by users
    /// and the token rewarded by the vault to user for locked token deposits
    HelixToken public token;

    /// Rate at which `token`s are created per block.
    uint256 public rewardPerBlock;
    
    /// Last block after which new rewards will no longer be minted
    uint256 public lastRewardBlock;
   
    /// Used for computing rewards
    uint256 public immutable PRECISION_FACTOR;

    /// Used for a weight's percentage, i.e. weight / WEIGHT_PERCENT
    uint256 public constant WEIGHT_PERCENT = 1000;

    /// Sets an upper limit on the number of decimals a token can have
    uint256 public constant MAX_DECIMALS = 30;

    // Emitted when a user makes a new deposit
    event NewDeposit(
        address indexed user, 
        uint256 indexed id, 
        uint256 amount, 
        uint256 weight, 
        uint256 depositTimestamp,
        uint256 withdrawTimestamp
    );

    // Emitted when a user updates an existing deposit
    event UpdateDeposit(
        address indexed user, 
        uint256 indexed id, 
        uint256 amount,            // amount added to existing deposit
        uint256 balance            // total balance deposited
    );

    // Emitted when a user withdraws a deposit
    event Withdraw(address indexed user, uint256 amount);

    // Emitted if the owner makes an emergency withdrawal
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    // Emitted when a user claims their accrued rewards
    event RewardClaimed(address indexed user, uint256 indexed id, uint256 reward);

    // Emitted when any action updates the pool
    event PoolUpdated(uint256 updateTimestamp);

    // Emitted when the reward per block is updated by the owner
    event RewardPerBlockUpdated(uint256 rewardPerBlock);

    modifier onlyValidDepositId(uint256 _id) {
        require(depositId > 0, "Vault: no deposit made");
        require(_id < depositId, "Vault: invalid id");
        _;
    }

    modifier onlyValidIndex(uint256 _index) {
        require(_index < durations.length, "Vault: invalid index");
        _;
    }

    modifier onlyValidDuration(uint256 _duration) {
        require(_duration > 0, "Vault: zero duration");
        _;
    }

    modifier onlyValidWeight(uint256 _weight) {
        require(_weight > 0, "Vault: zero weight");
        _;
    }

    modifier onlyValidAmount(uint256 _amount) {
        require(_amount > 0, "Vault: zero amount");
        _;
    }

    constructor(
        HelixToken _token,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _lastRewardBlock
    ) {
        token = _token;
        rewardPerBlock = _rewardPerBlock;

        lastRewardBlock = _lastRewardBlock;
        lastUpdateBlock = block.number > _startBlock ? block.number : _startBlock;

        // default locked deposit durations and their weights
        durations.push(Duration(90 days, 50));          // depositId == 0
        durations.push(Duration(180 days, 100));        // depositId == 1
        durations.push(Duration(360 days, 300));        // depositId == 2
        durations.push(Duration(540 days, 500));        // depositId == 3
        durations.push(Duration(720 days, 1000));       // depositId == 4
                                
        uint256 decimalsRewardToken = uint(token.decimals());
        require(decimalsRewardToken < MAX_DECIMALS, "Vault: token exceeds max decimals");

        PRECISION_FACTOR = uint(10 ** (uint(MAX_DECIMALS) - decimalsRewardToken));
    }

    /// Called by the deposit _id holder to withdraw their accumulated reward
    function claimReward(uint256 _id) external {
        Deposit storage d = _getDeposit(_id);

        _requireIsDepositor(msg.sender, d.depositor);
        _requireNotWithdrawn(d.withdrawn);

        updatePool();

        uint256 pending = _getReward(d.amount, d.weight) - d.rewardDebt;
        d.rewardDebt = _getReward(d.amount, d.weight);
        
        if (pending > 0) {
            token.transfer(msg.sender, pending);
        }

        emit RewardClaimed(msg.sender, _id, pending);
    } 

    /// Used internally to create a new deposit and lock _amount of token for _index
    function newDeposit(uint256 _amount, uint256 _index) 
        external 
        onlyValidAmount(_amount) 
        onlyValidIndex(_index) 
    {
        updatePool();

        // Get the new id of this deposit and create the deposit object
        uint256 id = depositId++;

        Deposit storage d = deposits[id];
        d.depositor = msg.sender;
        d.amount = _amount;
        d.weight = durations[_index].weight;
        d.depositTimestamp = block.timestamp;
        d.withdrawTimestamp = block.timestamp + durations[_index].duration;
        d.rewardDebt = _getReward(d.amount, d.weight);
        d.withdrawn = false;

        // Relay the deposit id to the user's account
        depositIds[msg.sender].push(id);

        token.transferFrom(msg.sender, address(this), _amount);
        emit NewDeposit(msg.sender, id, _amount, d.weight, d.depositTimestamp, d.withdrawTimestamp);
    }

    /// Used internally to increase deposit _id by _amount of token
    function updateDeposit(uint256 _amount, uint256 _id) 
        external 
        onlyValidAmount(_amount) 
        onlyValidDepositId(_id)
    {
        updatePool();

        Deposit storage d = _getDeposit(_id);
    
        _requireIsDepositor(msg.sender, d.depositor);
        _requireNotWithdrawn(d.withdrawn);

        d.amount += _amount;
        d.rewardDebt = _getReward(d.amount, d.weight);

        uint256 pending = _getReward(d.amount, d.weight);
        if (pending > 0) {
            token.transfer(msg.sender, pending);
        }
        token.transferFrom(msg.sender, address(this), _amount);

        emit UpdateDeposit(msg.sender, _id, _amount, d.amount);
    }

    /// Withdraw _amount of token from deposit _id
    function withdraw(uint256 _amount, uint256 _id) external onlyValidAmount(_amount) {
        Deposit storage d = _getDeposit(_id);
    
        _requireIsDepositor(msg.sender, d.depositor); 
        _requireNotWithdrawn(d.withdrawn);
        require(d.amount >= _amount, "Vault: invalid amount");
        require(block.timestamp >= d.withdrawTimestamp, "Vault: locked");
       
        // collect rewards
        updatePool();
        
        uint256 pending = _getReward(d.amount, d.weight);

        if (d.amount == _amount) {
            // Close the deposit if the amount deposited is being withdrawn
            d.withdrawn = true;
        } else {
            d.amount -= _amount;
            d.rewardDebt = _getReward(d.amount, d.weight);
        }

        if (pending > 0) {
            token.transfer(msg.sender, pending);
        }
        token.transfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _amount);
    }

    /// Called by the owner to update the earned _rewardPerBlock
    function updateRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        require(_rewardPerBlock <= 40 * 1e18, "Vault: max 40 per block");
        require(_rewardPerBlock >= 1e17, "Vault: min 0.1 per block");
        rewardPerBlock = _rewardPerBlock;
        emit RewardPerBlockUpdated(_rewardPerBlock);
    }

    /// Withdraw all the tokens in this contract. Emergency ONLY
    function emergencyWithdraw() external onlyOwner {
        TransferHelper.safeTransfer(address(token), msg.sender, token.balanceOf(address(this)));
    }
    
    /// Called by the owner to get a duration by it's _index and assign it a new _duration and _weight
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
        for (uint256 i = _index; i < durations.length - 1; i++) {
            durations[i] = durations[i + 1];
        }
        durations.pop();
    }

    /// Called to get deposit with _id's pending reward
    function pendingReward(uint256 _id) external view returns(uint) {
        Deposit storage d = _getDeposit(_id);
        
        _requireIsDepositor(msg.sender, d.depositor);
        _requireNotWithdrawn(d.withdrawn);

        uint256 _accTokenPerShare = accTokenPerShare;
        uint256 lpSupply = token.balanceOf(address(this));
        if (block.number > lastUpdateBlock && lpSupply != 0) {
            uint256 blocks = getBlocksDifference(lastUpdateBlock, block.number);
            uint256 reward = blocks * rewardPerBlock;
            _accTokenPerShare += reward * PRECISION_FACTOR / lpSupply;
        }
        return _getReward(d.amount, d.weight, _accTokenPerShare) - d.rewardDebt;
    }

    // Get the _user's deposit ids which are used for accessing their deposits
    function getDepositIds(address _user) external view returns(uint[] memory) {
        return depositIds[_user];
    }

    /// Get the array of durations
    function getDurations() external view returns(Duration[] memory) {
        return durations;
    }

    /// Return the Deposit associated with the _depositId
    function getDeposit(uint256 _depositId) external view returns (Deposit memory) {
        return _getDeposit(_depositId);
    }

    /// Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.number <= lastUpdateBlock) {
            return;
        }

        uint256 balance = token.balanceOf(address(this));
        uint256 reward;
        if (balance > 0) {
            uint256 blocks = getBlocksDifference(lastUpdateBlock, block.number);
            reward = blocks * rewardPerBlock;
            accTokenPerShare += reward * PRECISION_FACTOR / balance;
        }

        lastUpdateBlock = block.number;

        if (reward > 0) {
            token.mint(address(this), reward);
        }

        emit PoolUpdated(lastUpdateBlock);
    }

    /// Return the number of blocks between _to and _from blocks
    function getBlocksDifference(uint256 _from, uint256 _to) public view returns (uint) {
        require(_from <= _to, "Vault: invalid block values");
        if (_from > lastRewardBlock) {
            return 0;
        }
        return Math.min(_to, lastRewardBlock) - _from;
    }

    // Return the Deposit associated with the _depositId
    function _getDeposit(uint256 _depositId) private view onlyValidDepositId(_depositId) returns (Deposit storage) {
        return deposits[_depositId];
    }

    // Used internally for computing reward and reward debts
    function _getReward(uint256 _amount, uint256 _weight) private view returns(uint256 reward) {
        reward = _getReward(_amount, _weight, accTokenPerShare);
    }

    // Used internally for computing reward and reward debts
    function _getReward(uint256 _amount, uint256 _weight, uint256 _accTokenPerShare) private view returns(uint256 reward) {
        reward = _amount * _weight * _accTokenPerShare / PRECISION_FACTOR / WEIGHT_PERCENT;
    }
    // Used to require that the _caller is the _depositor
    function _requireIsDepositor(address _caller, address _depositor) private pure {
        require(_caller == _depositor, "Vault: not depositor");
    }
    
    // Used to require that the deposit is not _withdrawn
    function _requireNotWithdrawn(bool _withdrawn) private pure {
        require(!_withdrawn, "Vault: withdrawn");
    }
}
