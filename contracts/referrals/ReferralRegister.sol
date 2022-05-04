// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IHelixToken.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ReferralRegister is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

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
    EnumerableSet.AddressSet private _recorders;

    uint256 constant MAX_STAKING_FEE = 30; // 3%
    uint256 constant MAX_SWAP_FEE = 100; // 10%

    IHelixToken public token;
    uint256 public stakingRefFee;
    uint256 public swapRefFee;

    // Emitted when a referrer earns amount because referred made a transaction
    event ReferralReward(
        address indexed referred,
        address indexed referrer,
        uint amount
    );

    // Emitted when the owner sets the referral fees
    event FeesSet(uint256 stakingRefFee, uint256 swapRefFee);

    // Emitted when a referred adds a referrer
    event ReferrerAdded(address referred, address referrer);

    // Emitted when a referred removes their referrer
    event ReferrerRemoved(address referred);

    // Emitted when a referrer withdraws their earned referral rewards
    event Withdrawn(address referrer, uint256 rewards);

    modifier isValidAddress(address _address) {
        require(_address != address(0), "ReferralRegister: INVALID ADDRESS");
        _;
    }

    // Should be initialize by default with 
    // defaultStakingRef = 10 (meaning 1% reward for staking)
    // defaultSwapRef = 10 (meaning 1% reward for swap)
    constructor(IHelixToken _token, uint256 defaultStakingRef, uint256 defaultSwapRef) {
        token = _token;
        stakingRefFee = defaultStakingRef;
        swapRefFee = defaultSwapRef;
    }

    function recordStakingRewardWithdrawal(address user, uint256 amount) 
        external 
        onlyRecorder 
        isValidAddress(user)
    {
        uint256 stakingRefReward = ((amount * stakingRefFee) / 1000);
        balance[ref[user]] += stakingRefReward;

        emit ReferralReward(user, ref[user], stakingRefReward);
    }

    function recordSwapReward(address user, uint256 amount) 
        external 
        onlyRecorder 
        isValidAddress(user)
    {
        uint256 swapRefReward = ((amount * swapRefFee) / 1000);
        balance[ref[user]] += swapRefReward;

        emit ReferralReward(user, ref[user], swapRefReward);
    }

    function setFees(uint256 _stakingRefFee, uint256 _swapRefFee) external onlyOwner {
        // Prevent the owner from increasing referral rewards - values to be determined
        require(_stakingRefFee < MAX_STAKING_FEE && _swapRefFee < MAX_SWAP_FEE, "Referral Register: Fees are too high.");
        stakingRefFee = _stakingRefFee;
        swapRefFee = _swapRefFee;
        emit FeesSet(_stakingRefFee, _swapRefFee);
    }

    function addRef(address _referrer) external {
        require(ref[msg.sender] == address(0), "Referral Register: Address was already referred.");
        require(msg.sender != _referrer, "Referral Register: No self referral.");
        ref[msg.sender] = _referrer;
        emit ReferrerAdded(msg.sender, _referrer);
    }

    function removeRef() external {
        require(ref[msg.sender] != address(0), "Referral Register: Address was not referred.");
        ref[msg.sender] = address(0);
        emit ReferrerRemoved(msg.sender);
    }

    function withdraw() external nonReentrant {
        uint256 toMint = balance[msg.sender];
        require(toMint != 0, "ReferralRegister: NOTHING TO WITHDRAW");

        balance[msg.sender] = 0;

        token.mint(msg.sender, toMint);
        emit Withdrawn(msg.sender, toMint);
    }

    // Role functions for Recorders --------------------------------------------------------------------------------------

    /**
    * @dev used by owner to add recorder who can call a record function
    * @param account address of recorder to be added.
    * @return true if successful.
    */
    function addRecorder(address account) public onlyOwner returns(bool) {
        require(account != address(0), "ReferralRegister: account is the zero address");
        return EnumerableSet.add(_recorders, account);
    }

    /**
    * @dev used by owner to delete recorder who can call a record function
    * @param account address of recorder to be deleted.
    * @return true if successful.
    */
    function delRecorder(address account) external onlyOwner returns(bool) {
        require(account != address(0), "ReferralRegister: account is the zero address");
        return EnumerableSet.remove(_recorders, account);
    }

    /**
    * @dev See the number of recorders
    * @return number of recorders.
    */
    function getRecorderLength() public view returns(uint256) {
        return EnumerableSet.length(_recorders);
    }

    /**
    * @dev Check if an address is a recorder
    * @return true or false based on recorder status.
    */
    function isRecorder(address account) public view returns(bool) {
        return EnumerableSet.contains(_recorders, account);
    }

    /**
    * @dev Get the recorder at n location
    * @param index index of address set
    * @return address of recorder at index.
    */
    function getRecorder(uint256 index) external view onlyOwner returns(address) {
        require(index <= getRecorderLength() - 1, "ReferralRegister: index out of bounds");
        return EnumerableSet.at(_recorders, index);
    }

    /**
    * @dev Modifier
    */
    modifier onlyRecorder() {
        require(isRecorder(msg.sender), "ReferralRegister: caller is not a recorder");
        _;
    }
}
