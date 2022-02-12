// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/AuraToken.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReferralRegister is Ownable, ReentrancyGuard {

    /**
     * Referral fees are stored as: referred address => referrer address
     */
    mapping(address => address) public ref;

    /**
     * Rewards balance of each referrer.
     */
    mapping(address => uint256) public balance;

    uint256 constant MAX_STAKING_FEE = 30; // 3%
    uint256 constant MAX_SWAP_FEE = 100; // 10%

    AuraToken public auraToken;
    uint256 public stakingRefFee;
    uint256 public swapRefFee;

    // Should be initialize by default with 10 (meaning 10% reward for swap)
    // and 10 (meaning 1% reward for staking)
    constructor(AuraToken token, uint256 defaultSwapRef, uint256 defaultStakingRef) {
        auraToken = token;
        stakingRefFee = defaultStakingRef;
        swapRefFee = defaultSwapRef;
    }

    function recordStakingRewardWithdrawal(
        address user, 
        uint256 amount
    ) external {
        if (ref[user] == address(0)) {
            return;
        }
        uint256 stakingRefReward = ((amount * stakingRefFee) / 1000);
        balance[ref[user]] += stakingRefReward;
    }

    function recordSwapReward(
        address user,
        uint256 amount
    ) external {
        if (ref[user] == address(0)) {
            return;
        }
        uint256 swapRefReward = ((amount * swapRefFee) / 1000);
        balance[ref[user]] += swapRefReward;
    }

    function setFees(uint256 _stakingRefFee, uint256 _swapRefFee) external onlyOwner {
        // Prevent the owner from increasing referral rewards - values to be determined
        require(_stakingRefFee < MAX_STAKING_FEE && _swapRefFee < MAX_SWAP_FEE, "Those fees are too high.");
        stakingRefFee = _stakingRefFee;
        swapRefFee = _swapRefFee;
    }

    function addRef(address _referrer) external {
        require(ref[msg.sender] == address(0), "This address was already referred.");
        ref[msg.sender] = _referrer;
    }

    function removeRef() external {
        require(ref[msg.sender] != address(0), "This address was not referred.");
        ref[msg.sender] = address(0);
    }

    function withdraw() external nonReentrant {
        uint256 toMint = balance[msg.sender];
        if (toMint == 0) {
            return;
        }
        balance[msg.sender] = 0;

        auraToken.mint(msg.sender, toMint);
    }
}