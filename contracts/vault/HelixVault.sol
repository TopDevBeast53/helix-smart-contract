// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

contract HelixVault is Ownable {
    struct Deposit {
        address depositor;                  // the user making the deposit
        uint256 amount;                        // amount of token deposited
        uint256 weight;                        // reward weight by duration 
        uint256 depositTimestamp;              // when the deposit was made and used for calculating rewards
        uint256 withdrawTimestamp;             // when the deposit is eligible for withdrawal
        uint256 rewardDebt;                    // the debt owed on this deposit
        bool withdrawn;                     // true if the deposit has been withdrawn and false otherwise
    }
    
    struct Duration {
        uint256 duration;                      // length of time a deposit will be locked in seconds, 1 day == 86400
        uint256 weight;                        // reward modifier for locking a deposit for `duration`
    }
   
    // Maps depositIds to a Deposit
    mapping(uint256 => Deposit) public deposits;

    // Maps user addresses to the depositIds made by that address
    // Used to display to users their deposits
    mapping(address => uint[]) public depositIds;

    // Owner-curated list of valid deposit durations and associated reward weights
    Duration[] public durations;

    // Last block number that token distribution occurs.
    uint256 public lastRewardBlock;

    // Accumulated `token`s per share, times PRECISION_FACTOR.
    uint256 public accTokenPerShare;

    // Used to index deposits for storage and retrieval
    uint256 public depositId;    

    // Token deposited into and withdrawn from the vault by users
    // and the token rewarded by the vault to user for locked token deposits
    HelixToken public token;

    // Rate at which `token`s are created per block.
    uint256 public rewardPerBlock;
    
    // Last block at which mining new `token` will occur
    uint256 public bonusEndBlock;
   
    // Used for computing rewards
    uint256 public immutable PRECISION_FACTOR;

    // Used for a weight's percentage, i.e. weight / WEIGHT_PERCENT
    uint256 public constant WEIGHT_PERCENT = 1000;

    event NewDeposit(
        address indexed user, 
        uint256 indexed id, 
        uint256 amount, 
        uint256 weight, 
        uint256 depositTimestamp,
        uint256 withdrawTimestamp
    );

    event UpdateDeposit(
        address indexed user, 
        uint256 indexed id, 
        uint256 amount,            // amount added to existing deposit
        uint256 balance            // total balance deposited
    );

    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RefPercentChanged(uint256 currentPercent);

    // Emitted when a user claims their accrued rewards
    event RewardClaimed(address indexed user, uint256 indexed id, uint256 reward);

    // Emitted when any action updates the pool
    event PoolUpdated(uint256 updateTimestamp);

    // Emitted when the reward per block is updated by the owner
    event RewardPerBlockUpdated(uint256 rewardPerBlock);

    modifier isValidDepositId(uint256 id) {
        require(depositId > 0, "HelixVault: NO DEPOSITS MADE");
        require(id < depositId, "HelixVault: INVALID DEPOSIT ID");
        _;
    }

    modifier isValidIndex(uint256 index) {
        require(index < durations.length, "HelixVault: INVALID DURATION INDEX");
        _;
    }

    modifier isValidDuration(uint256 duration) {
        require(duration > 0, "HelixVault: INVALID DURATION");
        _;
    }

    modifier isValidWeight(uint256 weight) {
        require(weight > 0, "HelixVault: INVALID WEIGHT");
        _;
    }

    constructor(
        HelixToken _token,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock
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
                                
        uint256 decimalsRewardToken = uint(token.decimals());
        require(decimalsRewardToken < 30, "HelixVault: REWARD TOKEN MUST HAVE LESS THAN 30 DECIMALS");

        PRECISION_FACTOR = uint(10**(uint(30) - decimalsRewardToken));
    }

    // Used internally to create a new deposit and lock `amount` of token for `index` 
    function newDeposit(uint256 amount, uint256 index) external {
        require(amount > 0, "HelixVault: NOTHING TO DEPOSIT");
        updatePool();

        // Get the new id of this deposit and create the deposit object
        uint256 id = depositId++;

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
    function updateDeposit(uint256 amount, uint256 id) external {
        require(amount > 0, "HelixVault: NOTHING TO DEPOSIT");
        updatePool();

        Deposit storage d = _getDeposit(id);

        require(d.depositor == msg.sender, "HelixVault: CALLER IS NOT DEPOSITOR");
        require(!d.withdrawn, "HelixVault: TOKENS ARE ALREADY WITHDRAWN");

        d.amount += amount;
        d.rewardDebt = _getReward(d.amount, d.weight);

        uint256 pending = _getReward(d.amount, d.weight);
        if (pending > 0) {
            token.transfer(msg.sender, pending);
        }
        token.transferFrom(msg.sender, address(this), amount);

        emit UpdateDeposit(msg.sender, id, amount, d.amount);
    }

    // Withdraw `amount` of token from deposit `id`
    function withdraw(uint256 amount, uint256 id) external {
        Deposit storage d = _getDeposit(id);

        require(msg.sender == d.depositor, "HelixVault: CALLER IS NOT DEPOSITOR");
        require(!d.withdrawn, "HelixVault: TOKENS ARE ALREADY WITHDRAWN");
        require(d.amount >= amount && amount > 0, "HelixVault: INVALID AMOUNT");
        require(block.timestamp >= d.withdrawTimestamp, "HelixVault: TOKENS ARE LOCKED");
       
        // collect rewards
        updatePool();
        
        uint256 pending = _getReward(d.amount, d.weight);

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
    function pendingReward(uint256 id) external view returns(uint) {
        Deposit storage d = _getDeposit(id);
        require(d.depositor == msg.sender, "HelixVault: CALLER IS NOT DEPOSITOR");
        require(!d.withdrawn, "HelixVault: TOKENS ARE ALREADY WITHDRAWN");

        uint256 _accTokenPerShare = accTokenPerShare;
        uint256 lpSupply = token.balanceOf(address(this));
        if (block.number > lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
            uint256 reward = multiplier * rewardPerBlock;
            _accTokenPerShare += reward * PRECISION_FACTOR / lpSupply;
        }
        return _getReward(d.amount, d.weight, _accTokenPerShare) - d.rewardDebt;
    }

    // Called the deposit `id` holder to withdraw their accumulated reward
    function claimReward(uint256 id) external {
        Deposit storage d = _getDeposit(id);

        require(d.depositor == msg.sender, "HelixVault: CALLER IS NOT DEPOSITOR");
        require(!d.withdrawn, "HelixVault: TOKENS ARE ALREADY WITHDRAWN");

        updatePool();

        uint256 pending = _getReward(d.amount, d.weight) - d.rewardDebt;
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

        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            uint multiplier = getMultiplier(lastRewardBlock, block.number);
            uint reward = multiplier * rewardPerBlock;
            accTokenPerShare += reward * PRECISION_FACTOR / balance;
            token.mint(address(this), reward);
        }

        emit PoolUpdated(lastRewardBlock);
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint) {
        require(_from <= _to, "HelixVault: TO BLOCK MAY NOT PRECEED FROM BLOCK");
        if (_to <= bonusEndBlock) {
            return _to - _from;
        } else if (_from >= bonusEndBlock) {
            return 0;
        } else {
            return bonusEndBlock - _from;
        }
    }

    // Return the Deposit associated with this id
    function getDeposit(uint256 _depositId) external view returns(Deposit memory) {
        return _getDeposit(_depositId);
    }

    function _getDeposit(uint256 _depositId) 
        private 
        view 
        isValidDepositId(_depositId) 
        returns(Deposit storage) 
    {
        return deposits[_depositId];
    }

    // Used internally for computing reward and reward debts
    function _getReward(uint256 amount, uint256 weight) private view returns(uint256 reward) {
        reward = _getReward(amount, weight, accTokenPerShare);
    }

    function _getReward(uint256 amount, uint256 weight, uint256 _accTokenPerShare) private view returns(uint256 reward) {
        reward = amount * weight * _accTokenPerShare / PRECISION_FACTOR / WEIGHT_PERCENT;
    }

    // Get the user's deposit ids which are used for accessing their deposits
    function getDepositIds(address user) external view returns(uint[] memory) {
        return depositIds[user];
    }

    function updateRewardPerBlock(uint256 newAmount) external onlyOwner {
        require(newAmount <= 40 * 1e18, "HelixVault: 40 TOKENS MAX PER BLOCK");
        require(newAmount >= 1e17, "HelixVault: 0.1 TOKENS MIN PER BLOCK");
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

    function setDuration(uint256 index, uint256 duration, uint256 weight)
        external
        isValidIndex(index)
        isValidDuration(duration)
        isValidWeight(weight)  
        onlyOwner
    {
        durations[index].duration = duration;
        durations[index].weight = weight;
    }
    
    function addDuration(uint256 duration, uint256 weight) 
        external 
        isValidDuration(duration) 
        isValidWeight(weight)
        onlyOwner
    {
        durations.push(Duration(duration, weight));
    }

    function removeDuration(uint256 index) 
        external 
        isValidIndex(index)
        onlyOwner
    {
        // remove by array shift to preserve order
        for (uint256 i = index; i < durations.length - 1; i++) {
            durations[i] = durations[i + 1];
        }
        durations.pop();
    }
}
