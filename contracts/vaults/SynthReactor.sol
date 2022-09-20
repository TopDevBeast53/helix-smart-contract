// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import "../libraries/Percent.sol";
import "../fees/FeeCollector.sol";
import "../interfaces/IFeeMinter.sol";
import "../interfaces/ISynthToken.sol";
import "../interfaces/IHelixToken.sol";
import "../timelock/OwnableTimelockUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HelixVault is 
    FeeCollector, 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    OwnableTimelockUpgradeable
{
    struct User {
        uint256[] depositIndices;
        uint256 totalDeposited;
    }

    struct Deposit {
        address depositor;                  // user making the deposit
        uint256 amount;                     // amount of token deposited
        uint256 weight;                     // reward weight by duration 
        uint256 depositTimestamp;           // when the deposit was made and used for calculating rewards
        uint256 withdrawTimestamp;          // when the deposit is eligible for withdrawal
        uint256 lastHarvestTimestamp;
        uint256 rewardDebt;
        bool withdrawn;                     // true if the deposit has been withdrawn and false otherwise
    }
    
    struct Duration {
        uint256 duration;                   // length of time a deposit will be locked in seconds, 1 day == 86400
        uint256 weight;                     // reward modifier for locking a deposit for `duration`
    }

    mapping(address => User) public users;

    /// Maps depositIds to a Deposit
    // mapping(uint256 => Deposit) public deposits;
    Deposit[] public deposits;

    /// Maps user addresses to the depositIds made by that address
    /// Used to display to users their deposits
    // mapping(address => uint[]) public depositIndices;

    /// Owner-curated list of valid deposit durations and associated reward weights
    Duration[] public durations;

    /// Last block that update was called
    uint256 public lastUpdateBlock;

    uint256 public accTokenPerShare;

    uint256 private constant _REWARD_PRECISION = 1e12;

    /// Token deposited into and withdrawn from the vault by users
    /// and the token rewarded by the vault to user for locked token deposits
    address public helixToken;
    address public synthToken;

    uint256 public synthToMintPerBlock;

    /// Last block after which new rewards will no longer be minted
    uint256 public lastRewardBlock;
   
    /// Used for computing rewards
    uint256 public PRECISION_FACTOR;

    /// Sets an upper limit on the number of decimals a token can have
    uint256 public constant MAX_DECIMALS = 30;

    event Lock(
        address indexed user, 
        uint256 indexed depositId, 
        uint256 amount, 
        uint256 weight, 
        uint256 depositTimestamp,
        uint256 withdrawTimestamp
    );
    event UpdatePool(
        uint256 accTokenPerShare,
        uint256 lastUpdateBlock,
        uint256 reward
    );
    event Unlock(address indexed user);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event HarvestReward(address indexed user, uint256 indexed depositId, uint256 reward);
    event LastRewardBlockSet(uint256 lastRewardBlock);
    event SetFeeMinter(address indexed setter, address indexed feeMinter);
    event Compound(
        address indexed depositor, 
        uint256 indexed depositId, 
        uint256 amount, 
        uint256 reward
    );
    
    modifier onlyValidDepositIndex(uint256 _depositIndex) {
        require(_depositIndex > 0, "Vault: no deposit made");
        require(_depositIndex < deposits.length, "Vault: invalid depositIndex");
        _;
    }

    modifier onlyValidDurationIndex(uint256 durationIndex) {
        require(durationIndex < durations.length, "Vault: invalid index");
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

    function initialize(
        address _helixToken,
        address _synthToken
    ) external initializer {
        __Ownable_init();
        __OwnableTimelock_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        helixToken = _helixToken;
        synthToken = _synthToken;

        lastUpdateBlock = block.number;

        // default locked deposit durations and their weights
        durations.push(Duration(90 days, 5));
        durations.push(Duration(180 days, 10));
        durations.push(Duration(360 days, 30));
        durations.push(Duration(540 days, 50));
        durations.push(Duration(720 days, 100));
    }

    /// Create a new deposit and lock _amount of token for duration durationIndex
    function lock(uint256 _amount, uint256 _durationIndex) 
        external 
        whenNotPaused
        nonReentrant
        onlyValidAmount(_amount) 
        onlyValidDurationIndex(_durationIndex) 
    {
        updatePool();

        uint256 depositIndex = deposits.length;

        User storage user = users[msg.sender];
        user.depositIndices.push(depositIndex);
        user.totalDeposited += _amount;

        uint256 weight = durations[_durationIndex].weight;
        uint256 withdrawTimestamp = block.timestamp + durations[_durationIndex].duration;

        deposits.push(
            Deposit({
                depositor: msg.sender, 
                amount: _amount,
                weight: weight,
                depositTimestamp: block.timestamp,
                withdrawTimestamp: withdrawTimestamp,
                lastHarvestTimestamp: block.timestamp,
                rewardDebt: 0,
                withdrawn: false
            })
        );

        TransferHelper.safeTransferFrom(helixToken, msg.sender, address(this), _amount);

        emit Lock(
            msg.sender, 
            depositIndex, 
            _amount, 
            weight, 
            block.timestamp, 
            withdrawTimestamp 
        );
    }

    function getPendingReward(uint256 _depositIndex) 
        public 
        view 
        onlyValidDepositIndex(_depositIndex)
        returns(uint256) 
    {
        Deposit memory deposit = deposits[_depositIndex];     
        
        if (block.timestamp <= deposit.lastHarvestTimestamp) {
            return 0;
        }

        uint256 blockDelta = block.timestamp - deposit.lastHarvestTimestamp;
        return blockDelta * synthToMintPerBlock * deposit.weight;
    }

    /// Claim accrued rewards on _depositId
    function harvestReward(uint256 _depositIndex) 
        public 
        whenNotPaused 
        nonReentrant 
        onlyValidDepositIndex(_depositIndex)
    {
        updatePool();

        Deposit storage deposit = deposits[_depositIndex];
        require(msg.sender == deposit.depositor, "caller is not depositor");
        require(!deposit.withdrawn, "deposit already withdrawn");
        
        uint256 reward = deposit.amount * accTokenPerShare / _REWARD_PRECISION;
        uint256 toMint = reward > deposit.rewardDebt ? reward - deposit.rewardDebt : 0;
        deposit.rewardDebt = reward;

        if (toMint <= 0) {
            return;
        }

        toMint = toMint * deposit.weight;
        bool success = ISynthToken(synthToken).mint(msg.sender, toMint);
        require(success, "harvest reward failed");

        emit HarvestReward(msg.sender, _depositIndex, toMint);
    }

    function updatePool() public {
        if (block.number <= lastUpdateBlock) {
            return;
        }

        uint256 totalDepositedHelix = IERC20(helixToken).balanceOf(address(this));
        if (totalDepositedHelix == 0) {
            lastUpdateBlock = block.number;
            emit UpdatePool(accTokenPerShare, lastUpdateBlock, 0);
            return;
        }

        uint256 blockDelta = block.number - lastUpdateBlock;
        uint256 reward = blockDelta * synthToMintPerBlock;
        accTokenPerShare += reward * _REWARD_PRECISION / totalDepositedHelix;
        lastUpdateBlock = block.number;

        emit UpdatePool(accTokenPerShare, lastUpdateBlock, reward);
    }

    /// Withdraw _amount of token from _depositId
    function unlock(uint256 _depositIndex) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyValidDepositIndex(_depositIndex)
    {
        Deposit storage deposit = deposits[_depositIndex];
    
        require(msg.sender == deposit.depositor, "caller is not depositor");
        require(block.timestamp >= deposit.withdrawTimestamp, "deposit is locked");
       
        updatePool();
        
        // uint256 reward = _getReward(deposit.amount, deposit.weight) - deposit.rewardDebt;

        deposit.withdrawn = true;
        
        harvestReward(_depositIndex);

        // Return the original deposit to the depositor
        TransferHelper.safeTransfer(helixToken, msg.sender, deposit.amount);

        emit Unlock(msg.sender);
    }

    /// Withdraw all the tokens in this contract. Emergency ONLY
    function emergencyWithdrawErc20(address _token) external onlyOwner {
        TransferHelper.safeTransfer(_token, msg.sender, IERC20(_token).balanceOf(address(this)));
    }
    
    /// Called by the owner to get a duration by it's durationIndex and assign it a 
    /// new _duration and _weight
    function setDuration(uint256 durationIndex, uint256 _duration, uint256 _weight)
        external
        onlyTimelock
        onlyValidDurationIndex(durationIndex)
        onlyValidDuration(_duration)
        onlyValidWeight(_weight)  
    {
        durations[durationIndex].duration = _duration;
        durations[durationIndex].weight = _weight;
    }
   
    /// Called by the owner to add a new duration with _duration and _weight
    function addDuration(uint256 _duration, uint256 _weight) 
        external 
        onlyTimelock
        onlyValidDuration(_duration) 
        onlyValidWeight(_weight)
    {
        durations.push(Duration(_duration, _weight));
    }

    /// Called by the owner to remove the duration at durationIndex
    function removeDuration(uint256 durationIndex) 
        external 
        onlyTimelock
        onlyValidDurationIndex(durationIndex)
    {
        // remove by array shift to preserve order
        uint256 length = durations.length - 1;
        for (uint256 i = durationIndex; i < length; i++) {
            durations[i] = durations[i + 1];
        }
        durations.pop();
    }

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }


    // Get the _user's deposit indices which are used for accessing their deposits
    function getDepositIndices(address _user) external view returns (uint[] memory) {
        return users[_user].depositIndices;
    }

    /// Get the array of durations
    function getDurations() external view returns (Duration[] memory) {
        return durations;
    }

    /// Return the Deposit associated with _depositId
    function getDeposit(uint256 _depositIndex) external view returns (Deposit memory) {
        return deposits[_depositIndex];
    }
}
