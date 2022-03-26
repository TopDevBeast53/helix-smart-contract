// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/AuraToken.sol";
import "../interfaces/IBEP20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

contract HelixVault is Ownable {

    uint256 lastRewardBlock;  // Last block number that Auras distribution occurs.
    uint256 accAuraPerShare;   // Accumulated Auras per share, times PRECISION_FACTOR. See below.
    
    struct Deposit {
        address depositor;                  // the user making the deposit
        uint amount;                        // amount of token deposited
        uint weight;                        // reward weight by duration 
        uint depositTimestamp;              // when the deposit was made and used for calculating rewards
        uint withdrawTimestamp;             // when the deposit is eligible for withdrawal
        uint rewardDebt;                    // rewardDebt
        bool withdrawn;                     // true if the deposit has been withdrawn and false otherwise
    }
    
    struct Duration {
        uint duration;
        uint weight; // percent out of 100
    }
    
    Duration[] private durations;
    
    // maps deposit id to Deposit
    mapping(uint => Deposit) public deposits;

    // maps the user's address to their deposit ids
    mapping(address => uint[]) public depositIds;

    // the number of deposits made to this contract
    // used to index deposits for storage and retrieval
    uint numDeposits;    

    // The Aura TOKEN!
    IBEP20 public auraToken;
    IBEP20 public rewardToken;

    // Aura tokens created per block.
    uint256 public rewardPerBlock;
    
    // The block number when Aura mining ends.
    uint256 public bonusEndBlock;
   
    // The precision factor
    uint256 public PRECISION_FACTOR;

    event AddDeposit(address indexed user, uint256 id, uint256 amount, uint256 weight, uint depositTimestamp,uint withdrawTimestamp);
    event UpdateDeposit(address indexed user, uint256 id, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RefPercentChanged(uint256 currentPercent);

    constructor(
        IBEP20 _aura,
        IBEP20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock
    ) {
        auraToken = _aura;
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;

        bonusEndBlock = _bonusEndBlock;
        lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;

        durations.push(Duration(90 days, 5));
        durations.push(Duration(180 days, 10));
        durations.push(Duration(360 days, 30));
        durations.push(Duration(540 days, 50));
        durations.push(Duration(720 days, 100));
                                
        uint256 decimalsRewardToken = uint256(rewardToken.decimals());
        require(decimalsRewardToken < 30, "HelixVault: REWARD TOKEN MUST HAVE LESS THAN 30 DECIMALS");

        PRECISION_FACTOR = uint256(10**(uint256(30) - decimalsRewardToken));
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

    // View function to see pending Reward on frontend.
    function pendingReward(uint id) external view returns (uint256) {
        require(id < numDeposits, 'AuraVault: INVALID ID');
        Deposit storage d = deposits[id];
        require(d.depositor == msg.sender, 'AuraVault: CALLER IS NOT DEPOSITOR');
        require(d.withdrawn == false, 'AuraVault: TOKENS ARE ALREADY WITHDRAWN');

        uint256 _accAuraPerShare = accAuraPerShare;
        uint256 lpSupply = auraToken.balanceOf(address(this));
        if (block.number > lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
            uint256 AuraReward = multiplier * rewardPerBlock;
            _accAuraPerShare += AuraReward * PRECISION_FACTOR / lpSupply;
        }
        return d.amount * d.weight * _accAuraPerShare / PRECISION_FACTOR / 100 - d.rewardDebt;
    }

    function claimReward(uint id) external {
        require(id < numDeposits, 'AuraVault: INVALID ID');
        Deposit storage d = deposits[id];
        require(d.depositor == msg.sender, 'AuraVault: CALLER IS NOT DEPOSITOR');
        require(d.withdrawn == false, 'AuraVault: TOKENS ARE ALREADY WITHDRAWN');

        updatePool();
        uint256 pending = d.amount * d.weight * accAuraPerShare / PRECISION_FACTOR / 100 - d.rewardDebt;//100: for decimals of weight
        if(pending > 0) {
            TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
        }
        d.rewardDebt = d.amount * d.weight * accAuraPerShare / PRECISION_FACTOR / 100;
    } 

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        
        if (block.number <= lastRewardBlock) {
            return;
        }
        uint256 lpSupply = auraToken.balanceOf(address(this));
        if (lpSupply == 0) {
            lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
        uint256 helixReward = multiplier * rewardPerBlock;
        accAuraPerShare += helixReward * PRECISION_FACTOR / lpSupply;
        lastRewardBlock = block.number;
    }

    // Stake auraToken tokens to SmartChef\
    function deposit(uint id, uint256 amount, uint durationIndex) public {
        require(amount > 0, 'HelixVault: NOTHING TO DEPOSIT');
        require(durationIndex < durations.length, 'HelixVault: INVALID DURATION INDEX');
        require(id < numDeposits, 'AuraVault: INVALID ID');

        updatePool();
        if (id > 0) {
            Deposit storage d = deposits[id];
            require(d.depositor == msg.sender, 'AuraVault: CALLER IS NOT DEPOSITOR');
            require(d.withdrawn == false, 'AuraVault: TOKENS ARE ALREADY WITHDRAWN');
            uint256 pending = d.amount * d.weight * accAuraPerShare / PRECISION_FACTOR / 100 - d.rewardDebt;//100: for decimals of weight
            if(pending > 0) {
                TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
            }
            TransferHelper.safeTransferFrom(address(auraToken), msg.sender, address(this), amount);
            d.amount += amount;
            d.rewardDebt = d.amount * d.weight * accAuraPerShare / PRECISION_FACTOR / 100;
            emit UpdateDeposit(msg.sender, id, amount);
        } else {
            TransferHelper.safeTransferFrom(address(auraToken), msg.sender, address(this), amount);
            // Get the id of this deposit and create the deposit object
            uint newId = numDeposits++;
            Deposit storage d = deposits[newId];
            d.depositor = msg.sender;
            d.amount = amount;
            d.weight = durations[durationIndex].weight;
            d.depositTimestamp = block.timestamp;
            d.withdrawTimestamp = block.timestamp + durations[durationIndex].duration;
            d.withdrawn = false;

            d.rewardDebt = d.amount * d.weight * accAuraPerShare / PRECISION_FACTOR / 100;
            // Relay the deposit id to the user's account
            depositIds[msg.sender].push(id);
            emit AddDeposit(msg.sender, id, amount, d.weight, d.depositTimestamp, d.withdrawTimestamp);
        }
    }

    // Withdraw auraToken tokens from STAKING.
    function withdraw(uint id, uint amount) public {
        require(id < numDeposits && id > 0, 'AuraVault: INVALID ID');
        Deposit storage d = deposits[id];
        require(msg.sender == d.depositor, 'AuraVault: CALLER IS NOT DEPOSITOR');
        require(d.withdrawn == false, 'AuraVault: TOKENS ARE ALREADY WITHDRAWN');
        require(d.amount >= amount && amount > 0, "AuraVault: INVALID AMOUNT");
        require(block.timestamp >= d.withdrawTimestamp, 'AuraVault: TOKENS ARE LOCKED');
        
        updatePool();
        uint256 pending = d.amount * d.weight * accAuraPerShare / PRECISION_FACTOR / 100 - d.rewardDebt;//100: for decimals of weight
        if(pending > 0) {
            TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
        }
        if(d.amount == amount) {
            d.withdrawn = true;
        } else {
            d.amount -= amount;
            d.rewardDebt = d.amount * d.weight * accAuraPerShare / PRECISION_FACTOR / 100;
        }
        TransferHelper.safeTransfer(address(auraToken), msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function updateRewardPerBlock(uint256 newAmount) public onlyOwner {
        require(newAmount <= 40 * 1e18, 'Max per block 40 AuraToken');
        require(newAmount >= 1e17, 'Min per block 0.1 AuraToken');
        rewardPerBlock = newAmount;
    }

    // Withdraw reward. EMERGENCY ONLY.
    function emergencyRewardWithdraw(uint256 _amount) public onlyOwner {
        require(_amount <= rewardToken.balanceOf(address(this)), 'not enough token');
        TransferHelper.safeTransfer(address(rewardToken), msg.sender, _amount);
    }
    
    function getDurations() external view returns(Duration[] memory) {
        return durations;
    }

    modifier isValidIndex(uint index) {
        require(index < durations.length, 'invalid index');
        _;
    }

    modifier isValidDuration(uint duration) {
        require(duration > 0, 'invalid duration');
        _;
    }

    modifier isValidWeight(uint weight) {
        require(weight > 0 && weight <= 100, 'invalid weight');
        _;
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
