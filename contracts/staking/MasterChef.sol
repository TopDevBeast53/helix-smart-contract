// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/AuraToken.sol";
import "../interfaces/IMasterChef.sol";
import "../interfaces/IMigratorChef.sol";
import "../referrals/ReferralRegister.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

// MasterChef is the master of AuraToken. He can make AuraToken and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once AuraToken is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable, IMasterChef {
    // using SafeBEP20 for IBEP20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of AuraTokens
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accAuraTokenPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accAuraTokenPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }
    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. AuraTokens to distribute per block.
        uint256 lastRewardBlock; // Last block number that AuraTokens distribution occurs.
        uint256 accAuraTokenPerShare; // Accumulated AuraTokens per share, times 1e12. See below.
    }
    // The AuraToken TOKEN!
    AuraToken public auraToken;
    //Pools, Farms, Dev, Refs percent decimals
    uint256 public percentDec = 1000000;
    //Pools and Farms percent from token per block
    uint256 public stakingPercent;
    //Developers percent from token per block
    uint256 public devPercent;
    // Dev address.
    address public devaddr;
    // Last block then develeper withdraw dev and ref fee
    uint256 public lastBlockDevWithdraw;
    // AuraToken tokens created per block.
    uint256 public AuraTokenPerBlock;
    // Bonus muliplier for early AuraToken makers.
    uint256 public BONUS_MULTIPLIER = 1;
    // The migrator contract. It has a lot of power. Can only be set through governance (owner).
    IMigratorChef public migrator;
    // Referral Register contract
    ReferralRegister public refRegister;
    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when AuraToken mining starts.
    uint256 public startBlock;
    // Deposited amount AuraToken in MasterChef
    uint256 public depositedAura;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    constructor(
        AuraToken _AuraToken,
        address _devaddr,
        uint256 _AuraTokenPerBlock,
        uint256 _startBlock,
        uint256 _stakingPercent,
        uint256 _devPercent,
        ReferralRegister _referralRegister
    ) {
        auraToken = _AuraToken;
        devaddr = _devaddr;
        AuraTokenPerBlock = _AuraTokenPerBlock;
        startBlock = _startBlock;
        stakingPercent = _stakingPercent;
        devPercent = _devPercent;
        lastBlockDevWithdraw = _startBlock;
        refRegister = _referralRegister;
        
        // staking pool
        poolInfo.push(PoolInfo({
            lpToken: _AuraToken,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accAuraTokenPerShare: 0
        }));

        totalAllocPoint = 1000;
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function withdrawDevAndRefFee() public{
        require(lastBlockDevWithdraw < block.number, 'wait for new block');
        uint256 multiplier = getMultiplier(lastBlockDevWithdraw, block.number);
        uint256 AuraTokenReward = multiplier * AuraTokenPerBlock;
        auraToken.mint(devaddr, (AuraTokenReward * devPercent) / (percentDec));
        lastBlockDevWithdraw = block.number;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add( uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate ) public onlyOwner {
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
                accAuraTokenPerShare: 0
            })
        );
    }

    // Update the given pool's AuraToken allocation point. Can only be called by the owner.
    function set( uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint - (poolInfo[_pid].allocPoint) + (_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // Set the migrator contract. Can only be called by the owner.
    function setMigrator(IMigratorChef _migrator) public onlyOwner {
        migrator = _migrator;
    }

    // Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
    function migrate(uint256 _pid) public {
        require(address(migrator) != address(0), "migrate: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IERC20 lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        // lpToken.safeApprove(address(migrator), bal);
        IERC20 newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
        pool.lpToken = newLpToken;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
         return (_to - _from) * (BONUS_MULTIPLIER);
    }

    // Set ReferralRegister address
    function setReferralRegister(address _address) public onlyOwner {
        refRegister = ReferralRegister(_address);
    }

    // View function to see pending AuraTokens on frontend.
    function pendingAuraToken(uint256 _pid, address _user) external view returns (uint256){
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accAuraTokenPerShare = pool.accAuraTokenPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (_pid == 0){
            lpSupply = depositedAura;
        }

        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 AuraTokenReward = multiplier * (AuraTokenPerBlock) * (pool.allocPoint) / (totalAllocPoint) * (stakingPercent) / (percentDec);
            accAuraTokenPerShare = accAuraTokenPerShare + (AuraTokenReward * (1e12) / (lpSupply));
        }

        uint256 pending = user.amount * (accAuraTokenPerShare) / (1e12) - (user.rewardDebt);
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
            lpSupply = depositedAura;
        }
        if (lpSupply <= 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 AuraTokenReward = multiplier * (AuraTokenPerBlock) * (pool.allocPoint) / (totalAllocPoint) * (stakingPercent) / (percentDec);
        auraToken.mint(address(this), AuraTokenReward);
        pool.accAuraTokenPerShare = pool.accAuraTokenPerShare + (AuraTokenReward * (1e12) / (lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for AuraToken allocation.
    function deposit(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'deposit AuraToken by staking');

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount * (pool.accAuraTokenPerShare) / (1e12) - (user.rewardDebt);
            safeAuraTokenTransfer(msg.sender, pending);
        }
        TransferHelper.safeTransferFrom(address(pool.lpToken), address(msg.sender), address(this), _amount);
        user.amount = user.amount + (_amount);
        user.rewardDebt = user.amount * (pool.accAuraTokenPerShare) / (1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'withdraw AuraToken by unstaking');

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount * (pool.accAuraTokenPerShare) / (1e12) - (user.rewardDebt);
        safeAuraTokenTransfer(msg.sender, pending);
        user.amount = user.amount - (_amount);
        user.rewardDebt = user.amount * (pool.accAuraTokenPerShare) / (1e12);
        TransferHelper.safeTransfer(address(pool.lpToken), address(msg.sender), _amount);
        refRegister.recordStakingRewardWithdrawal(msg.sender, pending);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Stake AuraToken tokens to MasterChef
    function enterStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        updatePool(0);
        if (user.amount > 0) {
            uint256 pending = user.amount * (pool.accAuraTokenPerShare) / (1e12) - (user.rewardDebt);
            if(pending > 0) {
                safeAuraTokenTransfer(msg.sender, pending);
            }
        }
        if(_amount > 0) {
            TransferHelper.safeTransferFrom(address(pool.lpToken), address(msg.sender), address(this), _amount);
            user.amount = user.amount + (_amount);
            depositedAura = depositedAura + (_amount);
        }
        user.rewardDebt = user.amount * (pool.accAuraTokenPerShare) / (1e12);
        emit Deposit(msg.sender, 0, _amount);
    }

    // Withdraw AuraToken tokens from STAKING.
    function leaveStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(0);
        uint256 pending = user.amount * (pool.accAuraTokenPerShare) / (1e12) - (user.rewardDebt);
        if(pending > 0) {
            safeAuraTokenTransfer(msg.sender, pending);
            refRegister.recordStakingRewardWithdrawal(msg.sender, pending);
        }
        if(_amount > 0) {
            user.amount = user.amount - (_amount);
            TransferHelper.safeTransfer(address(pool.lpToken), address(msg.sender), _amount);
            depositedAura = depositedAura - (_amount);
        }
        user.rewardDebt = user.amount * (pool.accAuraTokenPerShare) / (1e12);
        emit Withdraw(msg.sender, 0, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        TransferHelper.safeTransfer(address(pool.lpToken), address(msg.sender), user.amount);

        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe AuraToken transfer function, just in case if rounding error causes pool to not have enough AuraTokens.
    function safeAuraTokenTransfer(address _to, uint256 _amount) internal {
        uint256 AuraTokenBal = auraToken.balanceOf(address(this));
        if (_amount > AuraTokenBal) {
            auraToken.transfer(_to, AuraTokenBal);
        } else {
            auraToken.transfer(_to, _amount);
        }
    }

    function setDevAddress(address _devaddr) public onlyOwner {
        devaddr = _devaddr;
    }

    function updateAuraPerBlock(uint256 newAmount) public onlyOwner {
        require(newAmount <= 40 * 1e18, 'Max per block 40 AuraToken');
        require(newAmount >= 1e17, 'Min per block 0.1 AuraToken');
        AuraTokenPerBlock = newAmount;
    }
}