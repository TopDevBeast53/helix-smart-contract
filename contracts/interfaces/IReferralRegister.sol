// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IHelixToken.sol";

interface IReferralRegister {
    function ref(address user) external view returns (address);
    function balance(address user) external view returns (uint256);
    function token() external view returns (IHelixToken);
    function stakingRefFee() external view returns (uint256);
    function swapRefFee() external view returns (uint256);
    function recordStakingRewardWithdrawal(address user, uint256 amount) external;
    function recordSwapReward(address user, uint256 amount) external;
    function setFees(uint256 _stakingRefFee, uint256 _swapRefFee) external;
    function addRef(address _referrer) external;
    function removeRef() external;
    function withdraw() external;
    function addRecorder(address account) external returns (bool);
    function delRecorder(address account) external returns (bool);
    function getRecorderLength() external view returns (uint256);
    function isRecorder(address account) external view returns (bool);
    function getRecorder(uint256 index) external view returns (address);
}
