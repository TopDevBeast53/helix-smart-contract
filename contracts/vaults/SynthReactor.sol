// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/ISynthToken.sol";
import "../interfaces/IHelixToken.sol";
import "../interfaces/IHelixChefNFT.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SynthReactor is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable
{
    struct User {
        uint256[] depositIndices;       // indices of all deposits opened by the user
        uint256 depositedHelix;         // sum of all unwithdrawn deposits
        uint256 weightedDeposits;       // sum of all unwithdrawn deposits modified by weight
        uint256 shares;                 // weightedDeposits modified by stakedNfts
        uint256 rewardDebt;             // used for calculating rewards
    }

    struct Deposit {
        address depositor;              // user making the deposit
        uint256 amount;                 // amount of deposited helix
        uint256 weight;                 // weight based on lock duration
        uint256 depositTimestamp;       // when the deposit was made
        uint256 unlockTimestamp;        // when the deposit can be unlocked
        bool withdrawn;                 // only true if the deposit has been withdrawn
    }
    
    struct Duration {
        uint256 duration;               // length of time a deposit will be locked (in seconds)
        uint256 weight;                 // modifies the reward based on the lock duration
    }

    /// Maps a user's address to a User
    mapping(address => User) public users;

    /// Maps depositIndices to a Deposit
    Deposit[] public deposits;

    /// Owner-curated list of valid deposit durations and associated weights
    Duration[] public durations;

    /// Last block that update was called
    uint256 public lastUpdateBlock;

    /// Used for calculating rewards
    uint256 public accTokenPerShare;
    uint256 private constant _REWARD_PRECISION = 1e19;
    uint256 private constant _WEIGHT_PRECISION = 100;

    /// Token locked in the reactor
    address public helixToken;

    /// Token rewarded by the reactor
    address public synthToken;

    /// Contract the reactor references for stakedNfts
    address public nftChef;

    /// Amount of synthToken to mint per block
    uint256 public synthToMintPerBlock;

    /// Sum of shares held by all users
    uint256 public totalShares;

    event Lock(
        address user, 
        uint256 depositId, 
        uint256 weight, 
        uint256 unlockTimestamp,
        uint256 depositedHelix,
        uint256 weightedDeposits,
        uint256 shares,
        uint256 totalShares
    );
    event Unlock(
        address user,
        uint256 depositIndex,
        uint256 depositedHelix,
        uint256 weightedDeposits,
        uint256 shares,
        uint256 totalShares
    );
    event UpdatePool(uint256 accTokenPerShare, uint256 lastUpdateBlock);
    event HarvestReward(address user, uint256 reward, uint256 rewardDebt);
    event EmergencyWithdrawErc20(address token, uint256 amount);
    event SetNftChef(address nftChef);
    event UpdateUserStakedNfts(
        address user,
        uint256 stakedNfts,
        uint256 userShares,
        uint256 totalShares
    );
    event SetSynthToMintPerBlock(uint256 synthToMintPerBlock);
    event SetDuration(uint256 durationIndex, uint256 duration, uint256 weight);
    event AddDuration(uint256 duration, uint256 weight, uint256 durationsLength);
    event RemoveDuration(uint256 durationIndex, uint256 durationsLength);
   
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

    /// Create a new deposit and lock _amount of helixToken for duration based on _durationIndex
    function lock(uint256 _amount, uint256 _durationIndex) 
        external 
        whenNotPaused
        nonReentrant
        onlyValidAmount(_amount) 
        onlyValidDurationIndex(_durationIndex) 
    {
        harvestReward();

        User storage user = users[msg.sender];

        uint256 depositIndex = deposits.length;
        user.depositIndices.push(depositIndex);

        user.depositedHelix += _amount;

        uint256 weight = durations[_durationIndex].weight;
        uint256 weightedDeposit = _getWeightedDeposit(_amount, weight);
        user.weightedDeposits += weightedDeposit;

        uint256 stakedNfts = _getUserStakedNfts(msg.sender);
        uint256 prevShares = user.shares;
        uint256 shares = _getShares(user.weightedDeposits, stakedNfts);
        assert(shares >= prevShares);
        totalShares += shares - prevShares;
        user.shares = shares;
  
        uint256 unlockTimestamp = block.timestamp + durations[_durationIndex].duration;
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
            weight,
            unlockTimestamp,
            user.depositedHelix, 
            user.weightedDeposits,
            user.shares,
            totalShares
        );
    }

    /// Unlock a deposit based on _depositIndex and return the caller's locked helixToken
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

        User storage user = users[msg.sender];
        user.depositedHelix -= deposit.amount;

        uint256 weightedDeposit = _getWeightedDeposit(deposit.amount, deposit.weight);
        user.weightedDeposits -= weightedDeposit;

        uint256 stakedNfts = _getUserStakedNfts(msg.sender);
        uint256 prevShares = user.shares;
        uint256 shares = _getShares(user.weightedDeposits, stakedNfts);
        assert(prevShares >= shares);
        totalShares -= prevShares - shares;
        user.shares = shares;

        deposit.withdrawn = true;

        TransferHelper.safeTransfer(helixToken, msg.sender, deposit.amount);

        emit Unlock(
            msg.sender, 
            _depositIndex,
            user.depositedHelix,
            user.weightedDeposits,
            user.shares,
            totalShares
        );
    }

    /// Return the _user's pending synthToken reward
    function getPendingReward(address _user) 
        external
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

    /// Update user and contract shares when the user stakes or unstakes nfts
    function updateUserStakedNfts(address _user, uint256 _stakedNfts) external onlyNftChef {
        // Do nothing if the user has no open deposits
        if (users[_user].depositedHelix <= 0) {
            return;
        }

        User storage user = users[_user];
        uint256 prevShares = user.shares;
        uint256 shares = _getShares(user.weightedDeposits, _stakedNfts);
        if (shares >= prevShares) {
            // if the user has increased their stakedNfts
            totalShares += shares - prevShares;
        } else {
            // if the user has decreased their staked nfts
            totalShares -= prevShares - shares;
        }
        user.shares = shares;

        updatePool();

        emit UpdateUserStakedNfts(_user, _stakedNfts, user.shares, totalShares);
    }

    /// Set the amount of synthToken to mint per block
    function setSynthToMintPerBlock(uint256 _synthToMintPerBlock) external onlyOwner {
        synthToMintPerBlock = _synthToMintPerBlock;
        emit SetSynthToMintPerBlock(_synthToMintPerBlock);
    }
    
    /// Set a durationIndex's _duration and _weight pair
    function setDuration(uint256 _durationIndex, uint256 _duration, uint256 _weight)
        external
        onlyOwner
        onlyValidDurationIndex(_durationIndex)
        onlyValidDuration(_duration)
        onlyValidWeight(_weight)  
    {
        durations[_durationIndex].duration = _duration;
        durations[_durationIndex].weight = _weight;
        emit SetDuration(_durationIndex, _duration, _weight);
    }
   
    /// Add a new _duration and _weight pair
    function addDuration(uint256 _duration, uint256 _weight) 
        external 
        onlyOwner
        onlyValidDuration(_duration) 
        onlyValidWeight(_weight)
    {
        durations.push(Duration(_duration, _weight));
        emit AddDuration(_duration, _weight, durations.length);
    }

    /// Remove an existing _duration and _weight pair by _durationIndex
    function removeDuration(uint256 _durationIndex) 
        external 
        onlyOwner
        onlyValidDurationIndex(_durationIndex)
    {
        // remove by array shift to preserve order
        uint256 length = durations.length - 1;
        for (uint256 i = _durationIndex; i < length; i++) {
            durations[i] = durations[i + 1];
        }
        durations.pop();
        emit RemoveDuration(_durationIndex, durations.length);
    }

    /// Set the _nftChef contract that the reactor uses to get a user's stakedNfts
    function setNftChef(address _nftChef) external onlyOwner onlyValidAddress(_nftChef) {
        nftChef = _nftChef;
        emit SetNftChef(_nftChef);
    }

    /// Pause the reactor and prevent user interaction
    function pause() external onlyOwner {
        _pause();
    }

    /// Unpause the reactor and allow user interaction
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Withdraw all the tokens in this contract. Emergency ONLY
    function emergencyWithdrawErc20(address _token) external onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        TransferHelper.safeTransfer(_token, msg.sender, amount);
        emit EmergencyWithdrawErc20(_token, amount); 
    }

    // Return the user's array of depositIndices
    function getUserDepositIndices(address _user) external view returns (uint[] memory) {
        return users[_user].depositIndices;
    }

    /// Return the length of the durations array
    function getDurationsLength() external view returns (uint256) {
        return durations.length;
    }

    /// Return the length of the deposits array
    function getDepositsLength() external view returns (uint256) {
        return deposits.length;
    }

    /// Harvest rewards accrued in synthToken by the caller's deposits
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

        emit HarvestReward(msg.sender, toMint, user.rewardDebt);
    }

    /// Update the pool
    function updatePool() public {
        if (block.number <= lastUpdateBlock) {
            return;
        }

        accTokenPerShare += _getAccTokenPerShareIncrement();
        lastUpdateBlock = block.number;
        emit UpdatePool(accTokenPerShare, lastUpdateBlock);
    }

    // Return the _user's stakedNfts
    function _getUserStakedNfts(address _user) private view returns (uint256) {
        return IHelixChefNFT(nftChef).getUserStakedNfts(_user); 
    }

    // Return the amount to increment the accTokenPerShare by
    function _getAccTokenPerShareIncrement() private view returns (uint256) {
        if (totalShares == 0) {
            return 0;
        }
        uint256 blockDelta = block.number - lastUpdateBlock;
        return blockDelta * synthToMintPerBlock * _REWARD_PRECISION / totalShares;
    }

    // Return the deposit _amount weighted by _weight
    function _getWeightedDeposit(uint256 _amount, uint256 _weight) private pure returns (uint256) {
        return _amount * (_WEIGHT_PRECISION + _weight) / _WEIGHT_PRECISION;
    }

    // Return the shares held by a user with _weightedDeposit and _stakedNfts
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
}
