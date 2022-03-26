// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IBEP20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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
        uint duration;                      // length of time a deposit will be locked
        uint weight;                        // reward modifier for locking a deposit for `duration`
    }
   
    // Maps depositIds to a Deposit
    mapping(uint => Deposit) public deposits;

    // Maps user addresses to the depositIds made by that address
    // Used to display to users their deposits
    mapping(address => uint[]) public depositIds;

    // Curated list of valid deposit durations and associated reward weights
    Duration[] public durations;

    // Last block number that token distribution occurs.
    uint256 public lastRewardBlock;

    // Accumulated `token`s per share, times PRECISION_FACTOR.
    uint256 public accTokenPerShare;

    // Used to index deposits for storage and retrieval
    // Note that depositId == 0 is never assigned
    // and is reserved for creating new deposits
    uint public depositId;    

    // Token deposited and withdrawn in the vault
    IBEP20 public token;

    // Token being rewarded for storing `token` in the vault
    IBEP20 public rewardToken;

    // Rate at which `token`s are created per block.
    uint256 public rewardPerBlock;
    
    // Last block at which mining new `token` will occur
    uint256 public bonusEndBlock;
   
    // Used for computing rewards
    uint256 public PRECISION_FACTOR;

    // Used for a weight's percentage, i.e. weight / WEIGHT_PERCENT
    uint256 public WEIGHT_PERCENT;

    event NewDeposit(
        address indexed user, 
        uint256 indexed id, 
        uint256 amount, 
        uint256 weight, 
        uint depositTimestamp,
        uint withdrawTimestamp
    );
    event UpdateDeposit(address indexed user, uint256 indexed id, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RefPercentChanged(uint256 currentPercent);

    modifier isValidId(uint id) {
        require(id != 0, 'HelixVault: DEPOSIT ID 0 IS RESERVED');
        require(id < depositId, 'HelixVault: INVALID DEPOSIT ID');
        _;
    }

    modifier isValidIndex(uint index) {
        require(index < durations.length, 'HelixVault: INVALID DURATION INDEX');
        _;
    }

    modifier isValidDuration(uint duration) {
        require(duration > 0, 'HelixVault: INVALID DURATION');
        _;
    }

    modifier isValidWeight(uint weight) {
        require(weight > 0 && weight <= WEIGHT_PERCENT, 'HelixVault: INVALID WEIGHT');
        _;
    }

    constructor(
        IBEP20 _token,
        IBEP20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock
    ) {
        token = _token;
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;

        bonusEndBlock = _bonusEndBlock;
        lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;

        // default locked deposit durations and their weights
        durations.push(Duration(90 days, 50));
        durations.push(Duration(180 days, 100));
        durations.push(Duration(360 days, 300));
        durations.push(Duration(540 days, 500));
        durations.push(Duration(720 days, 1000));
                                
        uint256 decimalsRewardToken = uint256(rewardToken.decimals());
        require(decimalsRewardToken < 30, "HelixVault: REWARD TOKEN MUST HAVE LESS THAN 30 DECIMALS");

        PRECISION_FACTOR = uint256(10**(uint256(30) - decimalsRewardToken));
        
        // weight == 50 -> 5%
        // weight == 300 -> 30%
        // weight == 1000 -> 100%
        WEIGHT_PERCENT = 1000;
    }

    // Deposit `amount` of token in the vault
    function deposit(uint256 amount, uint index, uint id) external {
        require(amount > 0, 'HelixVault: NOTHING TO DEPOSIT');

        updatePool();

        if (id == 0) {
            _newDeposit(amount, index);
        } else {
            _updateDeposit(amount, id);
        }
    }

    // Used internally to create a new deposit and lock `amount` of token for `index` 
    function _newDeposit(uint amount, uint index) private isValidIndex(index) {
        TransferHelper.safeTransferFrom(address(token), msg.sender, address(this), amount);
            
        // Get the new id of this deposit and create the deposit object
        uint id = ++depositId;

        Deposit storage d = deposits[id];
        d.depositor = msg.sender;
        d.amount = amount;
        d.weight = durations[index].weight;
        d.depositTimestamp = block.timestamp;
        d.withdrawTimestamp = block.timestamp + durations[index].duration;
        d.rewardDebt = _getRewardDebt(d.amount, d.weight);
        d.withdrawn = false;

        // Relay the deposit id to the user's account
        depositIds[msg.sender].push(id);

        emit NewDeposit(msg.sender, id, amount, d.weight, d.depositTimestamp, d.withdrawTimestamp);
    }

    // Used internally to add `amount` of token to deposit `id`
    function _updateDeposit(uint amount, uint id) private isValidId(id) {
        Deposit storage d = deposits[id];

        require(d.depositor == msg.sender, 'HelixVault: CALLER IS NOT DEPOSITOR');
        require(d.withdrawn == false, 'HelixVault: TOKENS ARE ALREADY WITHDRAWN');

        uint256 pending = _getRewardDebt(d.amount, d.weight);
        if (pending > 0) {
            TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
        }
        TransferHelper.safeTransferFrom(address(token), msg.sender, address(this), amount);

        d.amount += amount;
        d.rewardDebt = _getRewardDebt(d.amount, d.weight);

        emit UpdateDeposit(msg.sender, id, amount);
    }

    // Withdraw `amount` of token from deposit `id`
    function withdraw(uint id, uint amount) external isValidId(id) {
        Deposit storage d = deposits[id];

        require(msg.sender == d.depositor, 'HelixVault: CALLER IS NOT DEPOSITOR');
        require(d.withdrawn == false, 'HelixVault: TOKENS ARE ALREADY WITHDRAWN');
        require(d.amount >= amount && amount > 0, "HelixVault: INVALID AMOUNT");
        require(block.timestamp >= d.withdrawTimestamp, 'HelixVault: TOKENS ARE LOCKED');
       
        // collect rewards
        updatePool();
        uint256 pending = _getRewardDebt(d.amount, d.weight);
        if(pending > 0) {
            TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
        }

        if(d.amount == amount) {
            d.withdrawn = true;
        } else {
            d.amount -= amount;
            d.rewardDebt = _getRewardDebt(d.amount, d.weight);
        }

        TransferHelper.safeTransfer(address(token), msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    // View function to see pending Reward on frontend.
    function pendingReward(uint id) external view returns (uint256) {
        require(id < depositId, 'HelixVault: INVALID ID');
        Deposit storage d = deposits[id];
        require(d.depositor == msg.sender, 'HelixVault: CALLER IS NOT DEPOSITOR');
        require(d.withdrawn == false, 'HelixVault: TOKENS ARE ALREADY WITHDRAWN');

        uint256 _accTokenPerShare = accTokenPerShare;
        uint256 lpSupply = token.balanceOf(address(this));
        if (block.number > lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
            uint256 reward = multiplier * rewardPerBlock;
            _accTokenPerShare += reward * PRECISION_FACTOR / lpSupply;
        }
        return _getRewardDebt(d.amount, d.weight, _accTokenPerShare) - d.rewardDebt;
    }

    function claimReward(uint id) external {
        require(id < depositId, 'HelixVault: INVALID ID');
        Deposit storage d = deposits[id];
        require(d.depositor == msg.sender, 'HelixVault: CALLER IS NOT DEPOSITOR');
        require(d.withdrawn == false, 'HelixVault: TOKENS ARE ALREADY WITHDRAWN');

        updatePool();
        uint256 pending = _getRewardDebt(d.amount, d.weight) - d.rewardDebt;
        if (pending > 0) {
            TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
        }
        d.rewardDebt = _getRewardDebt(d.amount, d.weight);
    } 

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }
        uint256 lpSupply = token.balanceOf(address(this));
        if (lpSupply == 0) {
            lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
        uint256 reward = multiplier * rewardPerBlock;
        accTokenPerShare += reward * PRECISION_FACTOR / lpSupply;
        lastRewardBlock = block.number;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return _to - _from;
        } else if (_from >= bonusEndBlock) {
            return 0;
        } else {
            return bonusEndBlock - _from;
        }
    }

    // Used internally for computing reward debts
    function _getRewardDebt(uint amount, uint weight) private view returns(uint rewardDebt) {
        rewardDebt = _getRewardDebt(amount, weight, accTokenPerShare);
    }

    function _getRewardDebt(uint amount, uint weight, uint _accTokenPerShare) private view returns(uint rewardDebt) {
        rewardDebt = amount * weight * _accTokenPerShare / PRECISION_FACTOR / WEIGHT_PERCENT;
    }

    // Get the user's deposit ids which are used for accessing their deposits
    function getDepositIds(address user) external view returns(uint[] memory) {
        return depositIds[user];
    }

    function getDeposit(uint id)
        external
        view
        isValidId(id)
        returns
    (
        address depositor,
        uint amount,
        uint weight,
        uint depositTimestamp,
        uint withdrawTimestamp,
        uint rewardDebt,
        bool withdrawn
    ) {
        Deposit storage d = deposits[id];
        depositor = d.depositor;
        amount = d.amount;
        weight = d.weight;
        depositTimestamp = d.depositTimestamp;
        withdrawTimestamp = d.withdrawTimestamp;
        rewardDebt = d.rewardDebt;
        withdrawn = d.withdrawn;
    }

    function updateRewardPerBlock(uint256 newAmount) external onlyOwner {
        require(newAmount <= 40 * 1e18, 'HelixVault: 40 TOKENS MAX PER BLOCK');
        require(newAmount >= 1e17, 'HelixVault: 0.1 TOKENS MIN PER BLOCK');
        rewardPerBlock = newAmount;
    }

    // Withdraw reward. EMERGENCY ONLY.
    function emergencyRewardWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= rewardToken.balanceOf(address(this)), 'HelixVault: INSUFFICIENT REWARD TOKENS IN VAULT');
        TransferHelper.safeTransfer(address(rewardToken), msg.sender, _amount);
    }
    
    function getDurations() external view returns(Duration[] memory) {
        return durations;
    }

    function setDuration(uint index, uint duration, uint weight)
        external
        isValidIndex(index)
        isValidDuration(duration)
        isValidWeight(weight)  
        onlyOwner
    {
        durations[index].duration = duration;
        durations[index].weight = weight;
    }
    
    function addDuration(uint duration, uint weight) 
        external 
        isValidDuration(duration) 
        isValidWeight(weight)
        onlyOwner
    {
        durations.push(Duration(duration, weight));
    }

    function removeDuration(uint index) 
        external 
        isValidIndex(index)
        onlyOwner
    {
        durations[index] = durations[durations.length - 1];
        durations.pop();
    }
}
