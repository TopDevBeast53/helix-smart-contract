// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface IHelixNFT {
    function accruePoints(address account, uint amount) external;
    function setIsStaked(uint tokenId, bool isStaked) external;
    function getHelixPoints(uint tokenId) external view returns(uint);
    function setHelixPoints(uint tokenId, uint amount) external;
    function getInfoForStaking(uint tokenId) external view returns(address tokenOwner, bool isStaked, uint helixPoints);
    function remainAPToNextLevel(uint tokenId) external view returns (uint);
    function getAccumulatedAP(address user) external view returns (uint);
    function setAccumulatedAP(address user, uint amount) external;
    function levelUp(uint tokenId) external;
}
