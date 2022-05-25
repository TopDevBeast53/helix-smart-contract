// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IHelixToken.sol";
import "../fees/FeeCollector.sol";
import "../libraries/Percent.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/// Users (referrers) refer other users (referred) and referrers earn rewards when
/// referred users swap or stake
contract ReferralRegister is 
    FeeCollector, 
    Initializable, 
    OwnableUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    /// Per-block rate at which new helix tokens are minted as referrer rewards
    uint256 public constant MINT_RATE = 468;

    /// Token distributed as rewards to referrers
    IHelixToken public helixToken;

    /// Reward percent for staker referrers
    uint256 public stakingRefFee;

    /// Reward percent for swap referrers
    uint256 public swapRefFee;

    /// Sum of all referrer balances
    uint256 public totalBalance;

    /// Last block that reward tokens were minted
    uint256 public lastRewardBlock;

    /// Accounts approved by the contract owner which can call the "record" functions
    EnumerableSetUpgradeable.AddressSet private _recorders;

    /// Referral fees are stored as: referred address => referrer address
    mapping(address => address) public ref;

    /// Rewards balance of each referrer.
    mapping(address => uint256) public balance;

    /// Percent earned by staking
    uint256 constant MAX_STAKING_FEE = 3;   // 3%

    /// Percent earned by swaps
    uint256 constant MAX_SWAP_FEE = 10;     // 10%

    // Emitted when a referrer earns amount because referred made a transaction
    event ReferralReward(
        address indexed referred,
        address indexed referrer,
        uint256 amount
    );

    // Emitted when the owner sets the referral fees
    event FeesSet(uint256 stakingRefFee, uint256 swapRefFee);

    // Emitted when a referred adds a referrer
    event ReferrerAdded(address referred, address referrer);

    // Emitted when a referred removes their referrer
    event ReferrerRemoved(address referred);

    // Emitted when a referrer withdraws their earned referral rewards
    event Withdrawn(address referrer, uint256 rewards);

    // Emitted when the contract is updated and new tokens are minted
    event Update(uint256 minted);

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "ReferralRegister: zero address");
        _;
    }

    modifier onlyRecorder() {
        require(isRecorder(msg.sender), "ReferralRegister: not a recorder");
        _;
    }

    function initialize(
        IHelixToken _helixToken, 
        address _feeHandler,
        uint256 defaultStakingRef, 
        uint256 defaultSwapRef
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        _setFeeHandler(_feeHandler);

        helixToken = _helixToken;
        stakingRefFee = defaultStakingRef;
        swapRefFee = defaultSwapRef;
    }

    /// Accrue rewards to _user referrer for staking
    function recordStakingRewardWithdrawal(address _user, uint256 _amount) external onlyRecorder {
        _accrueReward(_user, _amount, stakingRefRee);
    }

    /// Accrue rewards to _user referrer for swaps
    function recordSwapReward(address _user, uint256 _amount) external onlyRecorder {
        _accrueReward(_user, _amount, swapRefFee);
    }

    // Accrue rewards to _user referrer based on _amount and _rate
    function _accrueReward(address _user, uint256 _amount, uint256 _rate)
        private
        isNotZeroAddress(_user)
    {
        uint256 reward = Percent.getPercentage(_amount, _rate);
        balance[ref[user]] += reward;
        totalBalance += reward;
        _update();

        emit ReferralReward(user, ref[user], reward);
    }

    function setFees(uint256 _stakingRefFee, uint256 _swapRefFee) external onlyOwner {
        // Prevent the owner from increasing referral rewards - values to be determined
        require(_stakingRefFee <= MAX_STAKING_FEE, "ReferralRegister: invalid staking fee");
        require(_swapRefFee <= MAX_SWAP_FEE, "ReferralRegister: invalid swap fee");
        stakingRefFee = _stakingRefFee;
        swapRefFee = _swapRefFee;
        emit FeesSet(_stakingRefFee, _swapRefFee);
    }

    function addRef(address _referrer) external {
        require(ref[msg.sender] == address(0), "ReferralRegister: already referred");
        require(msg.sender != _referrer, "ReferralRegister: no self referral");
        ref[msg.sender] = _referrer;
        emit ReferrerAdded(msg.sender, _referrer);
    }

    function removeRef() external {
        require(ref[msg.sender] != address(0), "ReferralRegister: not referred");
        ref[msg.sender] = address(0);
        emit ReferrerRemoved(msg.sender);
    }

    function withdraw() external whenNotPaused nonReentrant {
        uint256 _balance = balance[msg.sender];
        require(_balance != 0, "ReferralRegister: nothing to withdraw");
        
        // Update the amount of helixToken in the contract
        _update();
   
        // Reward the caller with some percentage of the total helix token balance
        // based on their percentage of the balance out of the total balance
        uint256 reward = _balance / totalBalance * getHelixTokenBalance();
    
        // Update the balances
        balance[msg.sender] = 0;
        totalBalance -= _balance;
    
        // Split the reward and extract the collector fee
        (uint256 collectorFee, uint256 callerAmount) = getCollectorFeeSplit(reward);
        if (callerAmount > 0) {
            helixToken.transfer(msg.sender, callerAmount);
        }
        if (collectorFee > 0) {
            _delegateTransfer(IERC20(address(helixToken)), address(this), collectorFee);
        }

        emit Withdrawn(msg.sender, reward);
    }

    /// Mint new reward tokens to the contract according to the mintRate
    function update() external nonReentrant {
        _update();
    }

    // Mint new helix tokens to the contract according to the mintRate
    function _update() private {
        if (block.number <= lastRewardBlock) {
            return;
        }      

        // number of blocks since last update * the number of tokens to mint per block
        uint256 toMint = (block.number - lastRewardBlock) * (MINT_RATE / 100);
        lastRewardBlock = block.number;

        helixToken.mint(address(this), toMint);

        emit Update(toMint);
    }
    
    /// Return the helixToken balance in this contract 
    function getHelixTokenBalance() public view returns (uint256) {
        return helixToken.balanceOf(address(this));
    }
    
    /**
    * @dev used by owner to add recorder who can call a record function
    * @param account address of recorder to be added.
    * @return true if successful.
    */
    function addRecorder(address account) public onlyOwner isNotZeroAddress(account) returns(bool) {
        return EnumerableSetUpgradeable.add(_recorders, account);
    }

    /**
    * @dev used by owner to delete recorder who can call a record function
    * @param account address of recorder to be deleted.
    * @return true if successful.
    */
    function delRecorder(address account) external onlyOwner isNotZeroAddress(account) returns(bool) {
        return EnumerableSetUpgradeable.remove(_recorders, account);
    }

    /**
    * @dev See the number of recorders
    * @return number of recorders.
    */
    function getRecorderLength() public view returns(uint256) {
        return EnumerableSetUpgradeable.length(_recorders);
    }

    /**
    * @dev Check if an address is a recorder
    * @return true or false based on recorder status.
    */
    function isRecorder(address account) public view returns(bool) {
        return EnumerableSetUpgradeable.contains(_recorders, account);
    }

    /**
    * @dev Get the recorder at n location
    * @param index index of address set
    * @return address of recorder at index.
    */
    function getRecorder(uint256 index) external view onlyOwner returns(address) {
        require(index <= getRecorderLength() - 1, "ReferralRegister: index out of bounds");
        return EnumerableSetUpgradeable.at(_recorders, index);
    }

    /// Called by owner to pause contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by owner to unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Called by owner to set feeHandler address
    function setFeeHandler(address _feeHandler) external onlyOwner {
        _setFeeHandler(_feeHandler);
    }
    
    function setCollectorPercent(uint256 _collectorPercent) external onlyOwner {
        _setCollectorPercent(_collectorPercent);
    }
}
