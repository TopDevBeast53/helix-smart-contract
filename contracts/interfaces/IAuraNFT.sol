// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface IAuraNFT {
    function accruePoints(address user, uint amount) external;
    function setIsStaked(uint tokenId, bool isStaked) external;
    function getAuraPoints(uint tokenId) external view returns(uint);
    function getInfoForStaking(uint tokenId) external view returns(address tokenOwner, bool isStaked, uint auraPoints);
}
