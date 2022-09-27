// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import "../libraries/Percent.sol";
import "../fees/FeeCollector.sol";
import "../interfaces/IFeeMinter.sol";
import "../interfaces/ISynthToken.sol";
import "../interfaces/IHelixToken.sol";
import "../interfaces/IHelixChefNFT.sol";
import "../timelock/OwnableTimelockUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SynthReactor is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    OwnableTimelockUpgradeable
{
    struct User {
        uint256[] depositIndices;
        uint256 depositedHelix;             // sum for all unwithdrawn deposits (amount)
        uint256 weightedDeposits;           // sum for all unwithdrawn deposits (amount * weight)
        uint256 shares;                     // weightedDeposits * stakedNfts
        uint256 rewardDebt;
    }

    struct Deposit {
        address depositor;                  // user making the deposit
        uint256 amount;                     // amount of token deposited
        uint256 weight;                     // reward weight by duration 
        uint256 depositTimestamp;           // when the deposit was made and used for calculating rewards
        uint256 unlockTimestamp;          // when the deposit is eligible for withdrawal
        bool withdrawn;                     // true if the deposit has been withdrawn and false otherwise
    }
    
    struct Duration {
        uint256 duration;                   // length of time a deposit will be locked in seconds, 1 day == 86400
        uint256 weight;                     // reward modifier for locking a deposit for `duration`
    }

    mapping(address => User) public users;

    /// Maps depositIds to a Deposit
    Deposit[] public deposits;

    /// Owner-curated list of valid deposit durations and associated reward weights
    Duration[] public durations;

    /// Last block that update was called
    uint256 public lastUpdateBlock;

    uint256 public accTokenPerShare;

    uint256 private constant _REWARD_PRECISION = 1e19;

    uint256 private constant _WEIGHT_PRECISION = 100;

    /// Token deposited into and withdrawn from the vault by users
    /// and the token rewarded by the vault to user for locked token deposits
    address public helixToken;
    address public synthToken;
    address public nftChef;

    uint256 public synthToMintPerBlock;

    uint256 public totalShares;

    /// Last block after which new rewards will no longer be minted
    uint256 public lastRewardBlock;
   
    event Lock(
        address indexed user, 
        uint256 indexed depositId, 
        uint256 amount, 
        uint256 weight, 
        uint256 depositTimestamp,
        uint256 unlockTimestamp
    );
    event UpdatePool(uint256 accTokenPerShare, uint256 lastUpdateBlock);
    event Unlock(address indexed user);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event HarvestReward(address indexed user, uint256 reward);
    event LastRewardBlockSet(uint256 lastRewardBlock);
    event SetFeeMinter(address indexed setter, address indexed feeMinter);
    event Compound(
        address indexed depositor, 
        uint256 indexed depositId, 
        uint256 amount, 
        uint256 reward
    );
    event SetNftChef();
    event UpdateUserStakedNfts(
        address user,
        uint256 stakedNfts,
        uint256 userShares,
        uint256 totalShares
    );
   
    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    modifier onlyValidDepositIndex(uint256 _depositIndex) {
        require(_depositIndex < deposits.length, "invalid deposit index");
        _;
    }

    modifier onlyValidDurationIndex(uint256 durationIndex) {
        require(durationIndex < durations.length, "invalid duration index");
        _;
    }

    modifier onlyValidDuration(uint256 _duration) {
        require(_duration > 0, "invalid duration");
        _;
    }

    modifier onlyValidWeight(uint256 _weight) {
        require(_weight > 0, "invalid weight");
        _;
    }

    modifier onlyValidAmount(uint256 _amount) {
        require(_amount > 0, "invalid amount");
        _;
    }

    modifier onlyNftChef() {
        require(msg.sender == nftChef, "caller is not nftChef");
        _;
    }

    function initialize(
        address _helixToken,
        address _synthToken,
        address _nftChef
    ) 
        external 
        initializer 
        onlyValidAddress(_helixToken)
        onlyValidAddress(_synthToken)
        onlyValidAddress(_nftChef)
    {
        __Ownable_init();
        __OwnableTimelock_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        helixToken = _helixToken;
        synthToken = _synthToken;
        nftChef = _nftChef;

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
        harvestReward();

        uint256 depositIndex = deposits.length;
        uint256 unlockTimestamp = block.timestamp + durations[_durationIndex].duration;
        uint256 weight = durations[_durationIndex].weight;
        uint256 weightedDeposit = _getWeightedDeposit(_amount, weight);
        uint256 stakedNfts = _getUserStakedNfts(msg.sender);
        uint256 shares = _getShares(weightedDeposit, stakedNfts);

        totalShares += shares;

        User storage user = users[msg.sender];
        user.depositIndices.push(depositIndex);
        user.depositedHelix += _amount;
        user.weightedDeposits += weightedDeposit;
        user.shares += shares;
  
        deposits.push(
            Deposit({
                depositor: msg.sender, 
                amount: _amount,
                weight: weight,
                depositTimestamp: block.timestamp,
                unlockTimestamp: unlockTimestamp,
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
            unlockTimestamp 
        );
    }

    /// Withdraw _amount of token from _depositId
    function unlock(uint256 _depositIndex) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyValidDepositIndex(_depositIndex)
    {
        harvestReward();

        Deposit storage deposit = deposits[_depositIndex];
        require(msg.sender == deposit.depositor, "caller is not depositor");
        require(block.timestamp >= deposit.unlockTimestamp, "deposit is locked");

        uint256 weightedDeposit = _getWeightedDeposit(deposit.amount, deposit.weight);
        uint256 stakedNfts = _getUserStakedNfts(msg.sender);
        uint256 shares = _getShares(weightedDeposit, stakedNfts);

        totalShares -= shares;

        User storage user = users[msg.sender];
        user.depositedHelix -= deposit.amount;
        user.weightedDeposits -= weightedDeposit;
        user.shares -= shares;

        deposit.withdrawn = true;

        TransferHelper.safeTransfer(helixToken, msg.sender, deposit.amount);

        emit Unlock(msg.sender);
    }

    /// Claim accrued rewards
    function harvestReward() 
        public 
        whenNotPaused 
    {
        updatePool();

        User storage user = users[msg.sender];

        uint256 reward = user.shares * accTokenPerShare / _REWARD_PRECISION;
        uint256 toMint = reward > user.rewardDebt ? reward - user.rewardDebt : 0;
        user.rewardDebt = reward;

        if (toMint > 0) {
            bool success = ISynthToken(synthToken).mint(msg.sender, toMint);
            require(success, "harvest reward failed");
        }

        emit HarvestReward(msg.sender, toMint);
    }

    function updatePool() public {
        if (block.number <= lastUpdateBlock) {
            return;
        }

        accTokenPerShare += _getAccTokenPerShareIncrement();
        lastUpdateBlock = block.number;
        emit UpdatePool(accTokenPerShare, lastUpdateBlock);
    }

    function getPendingReward(address _user) 
        public 
        view 
        onlyValidAddress(_user)
        returns (uint256)
    {
        uint256 _accTokenPerShare = accTokenPerShare;
        if (block.number > lastUpdateBlock) {
            _accTokenPerShare += _getAccTokenPerShareIncrement();
        }
        User memory user = users[msg.sender];     
        uint256 toMint = user.shares * _accTokenPerShare / _REWARD_PRECISION;
        return toMint > user.rewardDebt ? toMint - user.rewardDebt : 0;
    }

    function _getAccTokenPerShareIncrement() private view returns (uint256) {
        if (totalShares == 0) {
            return 0;
        }
        uint256 blockDelta = block.number - lastUpdateBlock;
        return blockDelta * synthToMintPerBlock * _REWARD_PRECISION / totalShares;
    }

    function _getWeightedDeposit(uint256 _amount, uint256 _weight) private pure returns (uint256) {
        return _amount * (_WEIGHT_PRECISION + _weight) / _WEIGHT_PRECISION;
    }

    function _getShares(uint256 _weightedDeposit, uint256 _stakedNfts) private pure returns (uint256) {   
        if (_stakedNfts <= 0) {
            return _weightedDeposit;
        }
        if (_stakedNfts <= 2) {
            return _weightedDeposit * 15 / 10;
        }
        else {
            return _weightedDeposit * 2;
        }
    }

    function updateUserStakedNfts(address _user, uint256 _stakedNfts) external onlyNftChef {
        // Do nothing if the user has no open deposits
        if (users[_user].depositedHelix <= 0) {
            return;
        }

        User storage user = users[_user];
        totalShares -= user.shares;
        user.shares = _getShares(user.weightedDeposits, _stakedNfts);
        totalShares += user.shares;

        updatePool();

        emit UpdateUserStakedNfts(_user, _stakedNfts, user.shares, totalShares);
    }

    /// Withdraw all the tokens in this contract. Emergency ONLY
    function emergencyWithdrawErc20(address _token) external onlyOwner {
        TransferHelper.safeTransfer(_token, msg.sender, IERC20(_token).balanceOf(address(this)));
    }

    function setSynthToMintPerBlock(uint256 _synthToMintPerBlock) external onlyOwner {
        synthToMintPerBlock = _synthToMintPerBlock;
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

    function setNftChef(address _nftChef) external onlyOwner onlyValidAddress(_nftChef) {
        nftChef = _nftChef;
        emit SetNftChef();
    }

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }
    

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    function _getUserStakedNfts(address _user) private view returns (uint256) {
        return IHelixChefNFT(nftChef).getUserStakedNfts(_user); 
    }

    // Get the _user's deposit indices which are used for accessing their deposits
    function getUserDepositIndices(address _user) external view returns (uint[] memory) {
        return users[_user].depositIndices;
    }

    /// Get the array of durations
    function getDurations() external view returns (Duration[] memory) {
        return durations;
    }
}
