// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

contract HelixVault is Ownable {
    struct Deposit {
        address depositor;                  // the user making the deposit
        uint amount;                        // amount of token deposited
        uint weight;                        // reward weight by duration 
        uint depositTimestamp;              // when the deposit was made and used for calculating rewards
        uint withdrawTimestamp;             // when the deposit is eligible for withdrawal
        uint rewardDebt;                    // the debt owed on this deposit
        bool withdrawn;                     // true if the deposit has been withdrawn and false otherwise
    }
    
    struct Duration {
        uint duration;                      // length of time a deposit will be locked in seconds, 1 day == 86400
        uint weight;                        // reward modifier for locking a deposit for `duration`
    }
   
    // Maps depositIds to a Deposit
    mapping(uint => Deposit) public deposits;

    // Maps user addresses to the depositIds made by that address
    // Used to display to users their deposits
    mapping(address => uint[]) public depositIds;

    // Owner-curated list of valid deposit durations and associated reward weights
    Duration[] public durations;

    // Last block number that token distribution occurs.
    uint public lastRewardBlock;

    // Accumulated `token`s per share, times PRECISION_FACTOR.
    uint public accTokenPerShare;

    // Used to index deposits for storage and retrieval
    uint public depositId;    

    // Token deposited into and withdrawn from the vault by users
    // and the token rewarded by the vault to user for locked token deposits
    HelixToken public token;

    // Rate at which `token`s are created per block.
    uint public rewardPerBlock;
    
    // Last block at which mining new `token` will occur
    uint public bonusEndBlock;
   
    // Used for computing rewards
    uint public PRECISION_FACTOR;

    // Used for a weight's percentage, i.e. weight / WEIGHT_PERCENT
    uint public WEIGHT_PERCENT;

    event NewDeposit(
        address indexed user, 
        uint indexed id, 
        uint amount, 
        uint weight, 
        uint depositTimestamp,
        uint withdrawTimestamp
    );

    event UpdateDeposit(
        address indexed user, 
        uint indexed id, 
        uint amount,            // amount added to existing deposit
        uint balance            // total balance deposited
    );

    event Withdraw(address indexed user, uint amount);
    event EmergencyWithdraw(address indexed user, uint amount);
    event RefPercentChanged(uint currentPercent);

    // Emitted when a user claims their accrued rewards
    event RewardClaimed(address indexed user, uint indexed id, uint reward);

    // Emitted when any action updates the pool
    event PoolUpdated(uint updateTimestamp);

    // Emitted when the reward per block is updated by the owner
    event RewardPerBlockUpdated(uint rewardPerBlock);

    modifier isValidDepositId(uint id) {
        require(depositId > 0, 'Vault: no deposit made');
        require(id < depositId, 'Vault: invalid id');
        _;
    }

    modifier isValidIndex(uint index) {
        require(index < durations.length, 'Vault: invalid index');
        _;
    }

    modifier notZeroDuration(uint duration) {
        require(duration > 0, 'Vault: zero duration');
        _;
    }

    modifier notZeroWeight(uint weight) {
        require(weight > 0, 'Vault: zero weight');
        _;
    }

    modifier notZeroAmount(uint256 amount) {
        require(amount > 0, "Vault: zero amount");
        _;
    }

    constructor(
        HelixToken _token,
        uint _rewardPerBlock,
        uint _startBlock,
        uint _bonusEndBlock
    ) {
        token = _token;
        rewardPerBlock = _rewardPerBlock;

        bonusEndBlock = _bonusEndBlock;
        lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;

        // default locked deposit durations and their weights
        durations.push(Duration(90 days, 50));
        durations.push(Duration(180 days, 100));
        durations.push(Duration(360 days, 300));
        durations.push(Duration(540 days, 500));
        durations.push(Duration(720 days, 1000));
                                
        uint decimalsRewardToken = uint(token.decimals());
        require(decimalsRewardToken < 30, 'Vault: invalid reward token decimals');

        PRECISION_FACTOR = uint(10**(uint(30) - decimalsRewardToken));
        
        // weight == 50 -> 5%
        // weight == 300 -> 30%
        // weight == 1000 -> 100%
        WEIGHT_PERCENT = 1000;
    }

    // Used internally to create a new deposit and lock `amount` of token for `index` 
    function newDeposit(uint amount, uint index) external notZeroAmount(amount) {
        updatePool();

        // Get the new id of this deposit and create the deposit object
        uint id = depositId++;

        Deposit storage d = deposits[id];
        d.depositor = msg.sender;
        d.amount = amount;
        d.weight = durations[index].weight;
        d.depositTimestamp = block.timestamp;
        d.withdrawTimestamp = block.timestamp + durations[index].duration;
        d.rewardDebt = _getReward(d.amount, d.weight);
        d.withdrawn = false;

        // Relay the deposit id to the user's account
        depositIds[msg.sender].push(id);

        token.transferFrom(msg.sender, address(this), amount);
        emit NewDeposit(msg.sender, id, amount, d.weight, d.depositTimestamp, d.withdrawTimestamp);
    }

    // Used internally to increase deposit `id` by `amount` of token
    function updateDeposit(uint amount, uint id) external notZeroAmount(amount) {
        updatePool();

        Deposit storage d = _getDeposit(id);
    
        _requireIsDepositor(msg.sender, d.depositor);
        _requireNotWithdrawn(d.withdrawn);

        d.amount += amount;
        d.rewardDebt = _getReward(d.amount, d.weight);

        uint pending = _getReward(d.amount, d.weight);
        if (pending > 0) {
            token.transfer(msg.sender, pending);
        }
        token.transferFrom(msg.sender, address(this), amount);

        emit UpdateDeposit(msg.sender, id, amount, d.amount);
    }

    // Withdraw `amount` of token from deposit `id`
    function withdraw(uint amount, uint id) external notZeroAmount(amount) {
        Deposit storage d = _getDeposit(id);
    
        _requireIsDepositor(msg.sender, d.depositor); 
        _requireNotWithdrawn(d.withdrawn);
        require(d.amount >= amount, 'Vault: invalid amount');
        require(block.timestamp >= d.withdrawTimestamp, 'Vault: locked');
       
        // collect rewards
        updatePool();

        uint pending = _getReward(d.amount, d.weight);

        if (d.amount == amount) {
            // Close the deposit if the amount deposited is being withdrawn
            d.withdrawn = true;
        } else {
            d.amount -= amount;
            d.rewardDebt = _getReward(d.amount, d.weight);
        }

        if (pending > 0) {
            token.transfer(msg.sender, pending);
        }
        token.transfer(msg.sender, amount);

        token.transfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    // View function to see pending Reward on frontend.
    function pendingReward(uint id) external view returns(uint) {
        Deposit storage d = _getDeposit(id);
        
        _requireIsDepositor(msg.sender, d.depositor);
        _requireNotWithdrawn(d.withdrawn);

        uint _accTokenPerShare = accTokenPerShare;
        uint lpSupply = token.balanceOf(address(this));
        if (block.number > lastRewardBlock && lpSupply != 0) {
            uint multiplier = getMultiplier(lastRewardBlock, block.number);
            uint reward = multiplier * rewardPerBlock;
            _accTokenPerShare += reward * PRECISION_FACTOR / lpSupply;
        }
        return _getReward(d.amount, d.weight, _accTokenPerShare) - d.rewardDebt;
    }

    // Called the deposit `id` holder to withdraw their accumulated reward
    function claimReward(uint id) external {
        Deposit storage d = _getDeposit(id);

        _requireIsDepositor(msg.sender, d.depositor);
        _requireNotWithdrawn(d.withdrawn);

        updatePool();

        uint pending = _getReward(d.amount, d.weight) - d.rewardDebt;
        d.rewardDebt = _getReward(d.amount, d.weight);

        if (pending > 0) {
            token.transfer(msg.sender, pending);
        }

        emit RewardClaimed(msg.sender, id, pending);
    } 

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }

        lastRewardBlock = block.number;

        uint balance = token.balanceOf(address(this));
        if (balance > 0) {
            uint multiplier = getMultiplier(lastRewardBlock, block.number);
            uint reward = multiplier * rewardPerBlock;
            accTokenPerShare += reward * PRECISION_FACTOR / balance;
            token.mint(address(this), reward);
        }

        emit PoolUpdated(lastRewardBlock);
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint _from, uint _to) public view returns (uint) {
        require(_from <= _to, 'Vault: invalid block values');
        if (_to <= bonusEndBlock) {
            return _to - _from;
        } else if (_from >= bonusEndBlock) {
            return 0;
        } else {
            return bonusEndBlock - _from;
        }
    }

    // Return the Deposit associated with this id
    function getDeposit(uint _depositId) external view returns(Deposit memory) {
        return _getDeposit(_depositId);
    }

    function _getDeposit(uint _depositId) 
        private 
        view 
        isValidDepositId(_depositId) 
        returns(Deposit storage) 
    {
        return deposits[_depositId];
    }

    // Used internally for computing reward and reward debts
    function _getReward(uint amount, uint weight) private view returns(uint reward) {
        reward = _getReward(amount, weight, accTokenPerShare);
    }

    function _getReward(uint amount, uint weight, uint _accTokenPerShare) private view returns(uint reward) {
        reward = amount * weight * _accTokenPerShare / PRECISION_FACTOR / WEIGHT_PERCENT;
    }

    // Get the user's deposit ids which are used for accessing their deposits
    function getDepositIds(address user) external view returns(uint[] memory) {
        return depositIds[user];
    }

    function updateRewardPerBlock(uint newAmount) external onlyOwner {
        require(newAmount <= 40 * 1e18, 'Vault: 40 max per block');
        require(newAmount >= 1e17, 'Vault: 0.1 min per block');
        rewardPerBlock = newAmount;
        emit RewardPerBlockUpdated(rewardPerBlock);
    }

    // Withdraw all the tokens in this contract. Emergency ONLY
    function emergencyRewardWithdraw() external onlyOwner {
        TransferHelper.safeTransfer(address(token), msg.sender, token.balanceOf(address(this)));
    }
    
    function getDurations() external view returns(Duration[] memory) {
        return durations;
    }

    function setDuration(uint index, uint duration, uint weight)
        external
        isValidIndex(index)
        notZeroDuration(duration)
        notZeroWeight(weight)  
        onlyOwner
    {
        durations[index].duration = duration;
        durations[index].weight = weight;
    }
    
    function addDuration(uint duration, uint weight) 
        external 
        notZeroDuration(duration) 
        notZeroWeight(weight)
        onlyOwner
    {
        durations.push(Duration(duration, weight));
    }

    function removeDuration(uint index) 
        external 
        isValidIndex(index)
        onlyOwner
    {
        // remove by array shift to preserve order
        for (uint i = index; i < durations.length - 1; i++) {
            durations[i] = durations[i + 1];
        }
        durations.pop();
    }

    function _requireIsDepositor(address caller, address depositor) private pure {
        require(caller == depositor, "Vault: not depositor");
    }

    function _requireNotWithdrawn(bool withdrawn) private pure {
        require(!withdrawn, "Vault: withdrawn");
    }
}
