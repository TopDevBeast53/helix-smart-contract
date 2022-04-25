// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IMasterChef {
    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function bucketDeposit(uint256 _bucketId, uint256 _poolId, uint256 _amount) external;

    function bucketWithdraw(uint256 _bucketId, uint256 _poolId, uint256 _amount) external;

    function bucketWithdrawAmountTo(address _recipient, uint256 _bucketId, uint256 _poolId, uint256 _amount) external;

    function bucketWithdrawYieldTo(address _recipient, uint256 _bucketId, uint256 _poolId, uint256 _yield) external;

    function updateBucket(uint256 _bucketId, uint256 _poolId) external;

    function getBucketYield(uint256 _bucketId, uint256 _poolId) external view returns(uint256 yield);

    function enterStaking(uint256 _amount) external;

    function leaveStaking(uint256 _amount) external;

    function pendingHelixToken(uint256 _pid, address _user) external view returns (uint256);

    function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256);

    function emergencyWithdraw(uint256 _pid) external;

    function poolLength() external view returns(uint256);

    function getLpToken(uint256 _pid) external view returns(address);
}
