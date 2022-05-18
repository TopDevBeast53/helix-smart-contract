// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IHelixToken.sol";
import "../fees/FeeCollectorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

contract ReferralRegister is Initializable, OwnableUpgradeable, FeeCollectorUpgradeable, ReentrancyGuardUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    /**
     * Referral fees are stored as: referred address => referrer address
     */
    mapping(address => address) public ref;

    /**
     * Rewards balance of each referrer.
     */
    mapping(address => uint256) public balance;

    /**
     * Accounts approved by the contract owner which can call the "record" functions
     */
    EnumerableSetUpgradeable.AddressSet private _recorders;

    uint256 constant MAX_STAKING_FEE = 30; // 3%
    uint256 constant MAX_SWAP_FEE = 100; // 10%

    IHelixToken public token;
    uint256 public stakingRefFee;
    uint256 public swapRefFee;

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

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "ReferralRegister: zero address");
        _;
    }

    modifier onlyRecorder() {
        require(isRecorder(msg.sender), "ReferralRegister: not a recorder");
        _;
    }

    function initialize(
        IHelixToken _token, 
        address _treasury,
        uint256 defaultStakingRef, 
        uint256 defaultSwapRef
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        treasury = _treasury;
        token = _token;
        stakingRefFee = defaultStakingRef;
        swapRefFee = defaultSwapRef;
    }

    function recordStakingRewardWithdrawal(address user, uint256 amount) 
        external 
        onlyRecorder 
        isNotZeroAddress(user)
    {
        uint256 stakingRefReward = ((amount * stakingRefFee) / 1000);
        balance[ref[user]] += stakingRefReward;

        emit ReferralReward(user, ref[user], stakingRefReward);
    }

    function recordSwapReward(address user, uint256 amount) 
        external 
        onlyRecorder 
        isNotZeroAddress(user)
    {
        uint256 swapRefReward = ((amount * swapRefFee) / 1000);
        balance[ref[user]] += swapRefReward;

        emit ReferralReward(user, ref[user], swapRefReward);
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

    function withdraw() external nonReentrant {
        uint256 toMint = balance[msg.sender];
        require(toMint != 0, "ReferralRegister: nothing to withdraw");

        balance[msg.sender] = 0;

        (uint256 treasuryFee, uint256 callerAmount) = getTreasuryFeeSplit(toMint);
        if (callerAmount > 0) {
            token.mint(msg.sender, callerAmount);
        }
        if (treasuryFee > 0) {
            token.mint(treasury, treasuryFee);
        }

        emit Withdrawn(msg.sender, toMint);
    }

    // Role functions for Recorders --------------------------------------------------------------------------------------

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
}
