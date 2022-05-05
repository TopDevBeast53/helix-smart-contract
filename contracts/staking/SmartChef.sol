// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IBEP20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

contract SmartChef is Ownable {
    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    // Info of each pool.
    struct PoolInfo {
        IBEP20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. Helixs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that Helixs distribution occurs.
        uint256 accHelixPerShare;   // Accumulated Helixs per share, times PRECISION_FACTOR. See below.
    }

    // The Helix TOKEN!
    IBEP20 public helixToken;
    IBEP20 public rewardToken;

    // Helix tokens created per block.
    uint256 public rewardPerBlock;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (address => UserInfo) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;
    // The block number when Helix mining starts.
    uint256 public startBlock;
    // The block number when Helix mining ends.
    uint256 public bonusEndBlock;
    // limit 100 Helix
    uint256 public limitAmount;

    // The precision factor
    uint256 public PRECISION_FACTOR;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RefPercentChanged(uint256 currentPercent);

    // Emitted when the owner sets a new limit amount
    event LimitAmountSet(uint256 limitAmount);

    // Emitted when any action causes the pool to be updated
    event PoolUpdated(uint256 indexed poolId, uint256 updateTimestamp);

    constructor(
        IBEP20 _helix,
        IBEP20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock,
        uint256 _limitAmount
    ) {
        helixToken = _helix;
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _bonusEndBlock;
        limitAmount = _limitAmount;

        uint256 decimalsRewardToken = uint256(rewardToken.decimals());
        require(decimalsRewardToken < 30, "Must be inferior to 30");

        PRECISION_FACTOR = uint256(10**(uint256(30) - decimalsRewardToken));

        // staking pool
        poolInfo.push(PoolInfo({
            lpToken: _helix,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accHelixPerShare: 0
        }));
        totalAllocPoint = 1000;
    }

    // Set the limit amount.
    function setLimitAmount(uint256 _amount) external onlyOwner {
        limitAmount = _amount;
        emit LimitAmountSet(_amount);
    }

    // Return remaining limit amount
    function remainingLimitAmount() external view returns(uint256) {
        if (userInfo[msg.sender].amount >= limitAmount){
            return 0;
        }
        return limitAmount - userInfo[msg.sender].amount;
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
    function pendingReward(address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[_user];
        uint256 accHelixPerShare = pool.accHelixPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 HelixReward = multiplier * rewardPerBlock * pool.allocPoint / totalAllocPoint;
            accHelixPerShare = accHelixPerShare + (HelixReward * PRECISION_FACTOR / lpSupply);
        }
        return user.amount * accHelixPerShare / PRECISION_FACTOR - user.rewardDebt;
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 HelixReward = multiplier * rewardPerBlock * pool.allocPoint / totalAllocPoint;
        pool.accHelixPerShare = pool.accHelixPerShare + (HelixReward * PRECISION_FACTOR / lpSupply);
        pool.lastRewardBlock = block.number;

        emit PoolUpdated(_pid, block.number);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Stake helixToken tokens to SmartChef
    function deposit(uint256 _amount) external {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[msg.sender];

        require(user.amount + _amount <= limitAmount, "Exceed limit amount");

        updatePool(0);
        uint256 pending = user.amount * pool.accHelixPerShare / PRECISION_FACTOR - user.rewardDebt;
        user.amount += _amount;
        user.rewardDebt = user.amount * pool.accHelixPerShare / PRECISION_FACTOR;

        if (pending > 0) {
            TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
        }
        if (_amount > 0) {
            TransferHelper.safeTransferFrom(address(pool.lpToken), msg.sender, address(this), _amount);
        }
        
        emit Deposit(msg.sender, _amount);
    }

    // Withdraw helixToken tokens from STAKING.
    function withdraw(uint256 _amount) external {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[msg.sender];

        require(user.amount >= _amount, "withdraw: not good");

        updatePool(0);
        uint256 pending = user.amount * pool.accHelixPerShare / PRECISION_FACTOR - user.rewardDebt;
        user.amount -= _amount;
        user.rewardDebt = user.amount * pool.accHelixPerShare / PRECISION_FACTOR;

        if (pending > 0) {
            TransferHelper.safeTransfer(address(rewardToken), msg.sender, pending);
        }
        if (_amount > 0) {
            TransferHelper.safeTransfer(address(pool.lpToken), msg.sender, _amount);
        }

        emit Withdraw(msg.sender, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw() external {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[msg.sender];
        uint256 amountToTransfer = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        if (amountToTransfer > 0) {
            TransferHelper.safeTransfer(address(pool.lpToken), msg.sender, amountToTransfer);
        }
        emit EmergencyWithdraw(msg.sender, amountToTransfer);
    }

    // Withdraw reward. EMERGENCY ONLY.
    function emergencyRewardWithdraw(uint256 _amount) public onlyOwner {
        require(_amount <= rewardToken.balanceOf(address(this)), "not enough token");
        TransferHelper.safeTransfer(address(rewardToken), msg.sender, _amount);
    }
}
