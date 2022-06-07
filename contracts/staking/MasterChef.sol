// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import "../interfaces/IMigratorChef.sol";
import "../interfaces/IReferralRegister.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

contract MasterChef is Initializable, PausableUpgradeable, OwnableUpgradeable {
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of HelixTokens
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accHelixTokenPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accHelixTokenPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }
    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. HelixTokens to distribute per block.
        uint256 lastRewardBlock; // Last block number that HelixTokens distribution occurs.
        uint256 accHelixTokenPerShare; // Accumulated HelixTokens per share, times 1e12. See below.
    }

    // Used by bucket deposits and withdrawals to enable a caller to deposit lpTokens
    // and accrue yield into distinct, uniquely indentified "buckets" such that each
    // bucket can be interacted with individually and without affecting deposits and 
    // yields in other buckets
    struct BucketInfo {
        uint256 amount;             // How many LP tokens have been deposited into the bucket
        uint256 rewardDebt;         // Reward debt. See explanation in UserInfo
        uint256 yield;              // Accrued but unwithdrawn yield
    }
     
    // The HelixToken TOKEN!
    HelixToken public helixToken;

    //Pools, Farms, Dev, Refs percent decimals
    uint256 public percentDec;

    //Pools and Farms percent from token per block
    uint256 public stakingPercent;

    //Developers percent from token per block
    uint256 public devPercent;

    // Dev address.
    address public devaddr;

    // Last block then develeper withdraw dev and ref fee
    uint256 public lastBlockDevWithdraw;

    // HelixToken tokens created per block.
    uint256 public HelixTokenPerBlock;

    // Bonus muliplier for early HelixToken makers.
    uint256 public BONUS_MULTIPLIER;

    // The migrator contract. It has a lot of power. Can only be set through governance (owner).
    IMigratorChef public migrator;

    // Referral Register contract
    IReferralRegister public refRegister;

    // Info of each pool.
    PoolInfo[] public poolInfo;

    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;

    // The block number when HelixToken mining starts.
    uint256 public startBlock;

    // Deposited amount HelixToken in MasterChef
    uint256 public depositedHelix;

    // Maps poolId => depositorAddress => bucketId => BucketInfo
    // where the depositor is depositing funds into a uniquely identified deposit "bucket"
    // and where those funds are only accessible by the depositor
    // Used by the bucket deposit and withdraw functions
    mapping(uint256 => mapping(address => mapping(uint256 => BucketInfo))) public bucketInfo;

    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Maps a lpToken address to a poolId
    mapping(address => uint256) public poolIds;

    event Deposit(
        address indexed user, 
        uint256 indexed pid, 
        uint256 amount
    );

    event Withdraw(
        address indexed user, 
        uint256 indexed pid, 
        uint256 amount
    );

    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    // Emitted when the owner adds a new LP Token to the pool
    event Added(uint256 indexed poolId, address indexed lpToken, bool withUpdate);

    // Emitted when the owner sets the pool alloc point
    event AllocPointSet(uint256 indexed poolId, uint256 allocPoint, bool withUpdate);

    // Emitted when the owner sets a new migrator contract
    event MigratorSet(address migrator);

    // Emitted when when a pool's liquidity is migrated
    event LiquidityMigrated(uint256 indexed poolId, address indexed lpToken);

    // Emitted when the owner sets a new referral register contract
    event ReferralRegisterSet(address referralRegister);

    // Emitted when the pool is updated
    event PoolUpdated(uint256 indexed poolId);

    // Emitted when the owner sets a new dev address
    event DevAddressSet(address devAddress);

    // Emitted when the owner updates the helix per block rate
    event HelixPerBlockUpdated(uint256 rate);
    
    // Emitted when a depositor deposits amount of lpToken into bucketId and stakes to poolId
    event BucketDeposit(
        address indexed depositor, 
        uint256 indexed bucketId,
        uint256 poolId, 
        uint256 amount
    );

    event BucketWithdraw(
        address indexed depositor, 
        uint256 indexed bucketId,
        uint256 poolId, 
        uint256 amount
    );

    event BucketWithdrawAmountTo(
        address indexed depositor, 
        address indexed recipient,
        uint256 indexed bucketId,
        uint256 poolId, 
        uint256 amount
    );

    event BucketWithdrawYieldTo(
        address indexed depositor, 
        address indexed recipient,
        uint256 indexed bucketId,
        uint256 poolId, 
        uint256 yield 
    );

    event UpdateBucket(
        address indexed depositor,
        uint256 indexed bucketId,
        uint256 indexed poolId
    );

    modifier isNotHelixPoolId(uint256 poolId) {
        require(poolId != 0, "MasterChef: invalid pool id");
        _;
    }

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "MasterChef: zero address");
        _;
    }

    function initialize(
        HelixToken _HelixToken,
        address _devaddr,
        uint256 _HelixTokenPerBlock,
        uint256 _startBlock,
        uint256 _stakingPercent,
        uint256 _devPercent,
        IReferralRegister _referralRegister
    ) external initializer {
        __Ownable_init();
        helixToken = _HelixToken;
        devaddr = _devaddr;
        HelixTokenPerBlock = _HelixTokenPerBlock;
        startBlock = _startBlock;
        stakingPercent = _stakingPercent;
        devPercent = _devPercent;
        lastBlockDevWithdraw = _startBlock;
        refRegister = _referralRegister;
        
        // staking pool
        poolInfo.push(PoolInfo({
            lpToken: _HelixToken,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accHelixTokenPerShare: 0
        }));
        poolIds[address(_HelixToken)] = 0;

        totalAllocPoint = 1000;
        percentDec = 1000000;
        BONUS_MULTIPLIER = 1;
    }

    function updateMultiplier(uint256 multiplierNumber) external onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Return the lpToken address associated with poolId _pid
    function getLpToken(uint256 _pid) external view returns(address) {
        return address(poolInfo[_pid].lpToken);
    }
    
    // Return the poolId associated with the lpToken address
    function getPoolId(address _lpToken) external view returns (uint256) {
        uint256 poolId = poolIds[_lpToken];
        if (poolId == 0) {
            require(_lpToken == address(helixToken), "MasterChef: token not added");
        }
        return poolId;
    }

    function withdrawDevAndRefFee() external {
        require(lastBlockDevWithdraw < block.number, "MasterChef: wait for new block");
        uint256 multiplier = getMultiplier(lastBlockDevWithdraw, block.number);
        uint256 HelixTokenReward = multiplier * HelixTokenPerBlock;
        lastBlockDevWithdraw = block.number;
        helixToken.mint(devaddr, (HelixTokenReward * devPercent) / (percentDec));
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint + (_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accHelixTokenPerShare: 0
            })
        );

        uint256 poolId = poolInfo.length - 1;
        poolIds[address(_lpToken)] = poolId;

        emit Added(poolId, address(_lpToken), _withUpdate);
    }

    // Update the given pool's HelixToken allocation point. Can only be called by the owner.
    function set( uint256 _pid, uint256 _allocPoint, bool _withUpdate) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint - (poolInfo[_pid].allocPoint) + (_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;

        emit AllocPointSet(_pid, _allocPoint, _withUpdate);
    }

    // Set the migrator contract. Can only be called by the owner.
    function setMigrator(IMigratorChef _migrator) external onlyOwner {
        migrator = _migrator;
        emit MigratorSet(address(_migrator));
    }

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    // Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
    function migrate(uint256 _pid) external {
        require(address(migrator) != address(0), "MasterChef: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IERC20 lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        // lpToken.safeApprove(address(migrator), bal);
        IERC20 newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), "MasterChef: migrate failed");
        pool.lpToken = newLpToken;

        emit LiquidityMigrated(_pid, address(newLpToken));
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
         return (_to - _from) * (BONUS_MULTIPLIER);
    }

    // Set ReferralRegister address
    function setReferralRegister(address _address) external onlyOwner {
        refRegister = IReferralRegister(_address);
        emit ReferralRegisterSet(_address);
    }

    // View function to see pending HelixTokens on frontend.
    function pendingHelixToken(uint256 _pid, address _user) external view returns (uint256){
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accHelixTokenPerShare = pool.accHelixTokenPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (_pid == 0){
            lpSupply = depositedHelix;
        }

        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 HelixTokenReward = multiplier * (HelixTokenPerBlock) * (pool.allocPoint) / (totalAllocPoint) * (stakingPercent) / (percentDec);
            accHelixTokenPerShare = accHelixTokenPerShare + (HelixTokenReward * (1e12) / (lpSupply));
        }

        uint256 pending = user.amount * (accHelixTokenPerShare) / (1e12) - (user.rewardDebt);
        return pending;
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (_pid == 0){
            lpSupply = depositedHelix;
        }
        if (lpSupply <= 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 HelixTokenReward = multiplier * (HelixTokenPerBlock) * (pool.allocPoint) / (totalAllocPoint) * (stakingPercent) / (percentDec);
        pool.accHelixTokenPerShare = pool.accHelixTokenPerShare + (HelixTokenReward * (1e12) / (lpSupply));
        pool.lastRewardBlock = block.number;
        helixToken.mint(address(this), HelixTokenReward);

        emit PoolUpdated(_pid);
    }

    // Deposit LP tokens to MasterChef for HelixToken allocation.
    function deposit(uint256 _pid, uint256 _amount) external whenNotPaused isNotHelixPoolId(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        uint256 pending = user.amount * (pool.accHelixTokenPerShare) / (1e12) - (user.rewardDebt);
        user.amount = user.amount + (_amount);
        user.rewardDebt = user.amount * (pool.accHelixTokenPerShare) / (1e12);

        if (pending > 0) {
            safeHelixTokenTransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            TransferHelper.safeTransferFrom(address(pool.lpToken), address(msg.sender), address(this), _amount);
        }

        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) external whenNotPaused isNotHelixPoolId(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "MasterChef: insufficient balance");

        updatePool(_pid);

        uint256 pending = user.amount * (pool.accHelixTokenPerShare) / (1e12) - (user.rewardDebt);
        user.amount -= _amount;
        user.rewardDebt = user.amount * (pool.accHelixTokenPerShare) / (1e12);

        if (pending > 0) {
            refRegister.rewardStake(msg.sender, pending);
            safeHelixTokenTransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            TransferHelper.safeTransfer(address(pool.lpToken), address(msg.sender), _amount);
        }

        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Deposit _amount of lpToken into _bucketId and accrue yield by staking _amount to _poolId
    function bucketDeposit(
        uint256 _bucketId,          // Unique bucket to deposit _amount into
        uint256 _poolId,            // Pool to deposit _amount into
        uint256 _amount             // Amount of lpToken being deposited
    ) 
        external 
        whenNotPaused
        isNotHelixPoolId(_poolId)
    {
        PoolInfo storage pool = poolInfo[_poolId];
        BucketInfo storage bucket = bucketInfo[_poolId][msg.sender][_bucketId];

        updatePool(_poolId);

        // If the bucket already has already accrued rewards, 
        // increment the yield before resetting the rewardDebt
        if (bucket.amount > 0) {
            bucket.yield += bucket.amount * (pool.accHelixTokenPerShare) / (1e12) - (bucket.rewardDebt);
        }
    
        // Update the bucket amount and reset the rewardDebt
        bucket.amount += _amount;
        bucket.rewardDebt = bucket.amount * (pool.accHelixTokenPerShare) / (1e12);

        // Transfer amount of lpToken from caller to chef
        require(
            _amount <= pool.lpToken.allowance(msg.sender, address(this)), 
            "MasterChef: insufficient allowance"
        );
        TransferHelper.safeTransferFrom(address(pool.lpToken), msg.sender, address(this), _amount);

        emit BucketDeposit(msg.sender, _bucketId, _poolId, _amount);
    }

    // Withdraw _amount of lpToken and all accrued yield from _bucketId and _poolId
    function bucketWithdraw(uint256 _bucketId, uint256 _poolId, uint256 _amount) external whenNotPaused isNotHelixPoolId(_poolId) {
        PoolInfo storage pool = poolInfo[_poolId];
        BucketInfo storage bucket = bucketInfo[_poolId][msg.sender][_bucketId];

        require(_amount <= bucket.amount, "MasterChef: insufficient balance");

        updatePool(_poolId);
    
        // Calculate the total yield to withdraw
        uint256 pending = bucket.amount * (pool.accHelixTokenPerShare) / (1e12) - (bucket.rewardDebt);
        uint256 yield = bucket.yield + pending;

        // Update the bucket state
        bucket.amount -= _amount;
        bucket.rewardDebt = bucket.amount * (pool.accHelixTokenPerShare) / (1e12);
        bucket.yield = 0;

        // Withdraw the yield and lpToken
        safeHelixTokenTransfer(msg.sender, yield);
        TransferHelper.safeTransfer(address(pool.lpToken), address(msg.sender), _amount);

        emit BucketWithdraw(msg.sender, _bucketId, _poolId, _amount);
    }

    // Withdraw _amount of lpToken from _bucketId and from _poolId
    // and send the withdrawn _amount to _recipient
    function bucketWithdrawAmountTo(
        address _recipient,
        uint256 _bucketId,
        uint256 _poolId, 
        uint256 _amount
    ) 
        external 
        whenNotPaused
        isNotZeroAddress(_recipient)
        isNotHelixPoolId(_poolId)
    {
        PoolInfo storage pool = poolInfo[_poolId];

        BucketInfo storage bucket = bucketInfo[_poolId][msg.sender][_bucketId];
        require(
            _amount <= bucket.amount, 
            "MasterChef: insufficient balance"
        );

        updatePool(_poolId);

        // Update the bucket state
        bucket.yield += bucket.amount * (pool.accHelixTokenPerShare) / (1e12) - (bucket.rewardDebt);
        bucket.amount -= _amount;
        bucket.rewardDebt = bucket.amount * (pool.accHelixTokenPerShare) / (1e12);

        // Transfer only lpToken to the recipient
        TransferHelper.safeTransfer(address(pool.lpToken), _recipient, _amount);

        emit BucketWithdrawAmountTo(msg.sender, _recipient, _bucketId, _poolId, _amount);
    }

    // Withdraw total yield in HelixToken from _bucketId and _poolId and send to _recipient
    function bucketWithdrawYieldTo(
        address _recipient,
        uint256 _bucketId,
        uint256 _poolId,
        uint256 _yield
    ) 
        external 
        whenNotPaused
        isNotZeroAddress(_recipient)
        isNotHelixPoolId(_poolId)
    {
        updatePool(_poolId);

        PoolInfo storage pool = poolInfo[_poolId];
        BucketInfo storage bucket = bucketInfo[_poolId][msg.sender][_bucketId];

        // Total yield is any pending yield plus any previously calculated yield
        uint256 pending = bucket.amount * (pool.accHelixTokenPerShare) / (1e12) - (bucket.rewardDebt);
        uint256 yield = bucket.yield + pending;

        require(
            _yield <= yield,
            "MasterChef: insufficient balance"
        );

        // Update bucket state
        bucket.rewardDebt = bucket.amount * (pool.accHelixTokenPerShare) / (1e12);
        yield -= _yield;

        safeHelixTokenTransfer(_recipient, _yield);

        emit BucketWithdrawYieldTo(msg.sender, _recipient, _bucketId, _poolId, _yield);
    }

    // Update _poolId and _bucketId yield and rewardDebt
    function updateBucket(uint256 _bucketId, uint256 _poolId) external isNotHelixPoolId(_poolId) {
        updatePool(_poolId);

        PoolInfo storage pool = poolInfo[_poolId];
        BucketInfo storage bucket = bucketInfo[_poolId][msg.sender][_bucketId];

        bucket.yield += bucket.amount * (pool.accHelixTokenPerShare) / (1e12) - (bucket.rewardDebt);
        bucket.rewardDebt = bucket.amount * (pool.accHelixTokenPerShare) / (1e12);

        emit UpdateBucket(msg.sender, _bucketId, _poolId);
    }

    function getBucketYield(uint256 _bucketId, uint256 _poolId) 
        external 
        view 
        isNotHelixPoolId(_poolId)
        returns (uint256 yield) 
    {
        BucketInfo storage bucket = bucketInfo[_poolId][msg.sender][_bucketId];
        yield = bucket.yield;
    }

    // Stake HelixToken tokens to MasterChef
    function enterStaking(uint256 _amount) external whenNotPaused {
        updatePool(0);
        depositedHelix += _amount;

        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];

        uint256 pending = user.amount * (pool.accHelixTokenPerShare) / (1e12) - (user.rewardDebt);
        user.amount += _amount;
        user.rewardDebt = user.amount * (pool.accHelixTokenPerShare) / (1e12);
        
        if (pending > 0) {
            safeHelixTokenTransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            TransferHelper.safeTransferFrom(address(pool.lpToken), address(msg.sender), address(this), _amount);
        }

        emit Deposit(msg.sender, 0, _amount);
    }

    // Withdraw HelixToken tokens from STAKING.
    function leaveStaking(uint256 _amount) external whenNotPaused {
        updatePool(0);
        depositedHelix -= _amount;
        
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];

        require(user.amount >= _amount, "MasterChef: insufficient balance");

        uint256 pending = user.amount * (pool.accHelixTokenPerShare) / (1e12) - (user.rewardDebt);
        user.amount -= _amount;
        user.rewardDebt = user.amount * (pool.accHelixTokenPerShare) / (1e12);

        if (pending > 0) {
            refRegister.rewardStake(msg.sender, pending);
            safeHelixTokenTransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            TransferHelper.safeTransfer(address(pool.lpToken), address(msg.sender), _amount);
        }

        emit Withdraw(msg.sender, 0, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        uint256 _amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;

        TransferHelper.safeTransfer(address(pool.lpToken), address(msg.sender), _amount);

        emit EmergencyWithdraw(msg.sender, _pid, _amount);
    }

    // Safe HelixToken transfer function, just in case if rounding error causes pool to not have enough HelixTokens.
    function safeHelixTokenTransfer(address _to, uint256 _amount) internal {
        uint256 helixTokenBal = helixToken.balanceOf(address(this));
        uint256 toTransfer = _amount > helixTokenBal ? helixTokenBal : _amount;
        require(helixToken.transfer(_to, toTransfer), "MasterChef: transfer failed");
    }

    function setDevAddress(address _devaddr) external onlyOwner {
        devaddr = _devaddr;
        emit DevAddressSet(_devaddr);
    }

    function updateHelixPerBlock(uint256 newAmount) external onlyOwner {
        require(newAmount <= 40 * 1e18, "MasterChef: max 40 per block");
        require(newAmount >= 1e17, "MasterChef: min 0.1 per block");
        HelixTokenPerBlock = newAmount;
        emit HelixPerBlockUpdated(newAmount);
    }
}
