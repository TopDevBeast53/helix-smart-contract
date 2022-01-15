// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface IAuraNFT {
    function accruePoints(address user, uint amount) external;
    function setFreeze(uint tokenId, bool isFrozen) external;
    function getPoints(uint tokenId) external view returns(uint);
    function getInfoForStaking(uint tokenId) external view returns(address tokenOwner, bool isFrozen, uint points);
}
