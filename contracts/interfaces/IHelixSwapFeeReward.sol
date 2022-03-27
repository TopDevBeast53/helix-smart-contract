// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IHelixSwapFeeReward {
    function swap(address account, address input, address output, uint256 amount) external returns (bool);
}