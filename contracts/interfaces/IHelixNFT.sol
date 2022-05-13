// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface IHelixNFT {
    function accruePoints(address account, uint256 amount) external;
    function setIsStaked(uint256 tokenId, bool isStaked) external;
    function getHelixPoints(uint256 tokenId) external view returns(uint);
    function setHelixPoints(uint256 tokenId, uint256 amount) external;
    function getInfoForStaking(uint256 tokenId) external view returns(address tokenOwner, bool isStaked, uint256 helixPoints);
    function remainHPToNextLevel(uint256 tokenId) external view returns (uint);
    function getAccumulatedHP(address user) external view returns (uint);
    function setAccumulatedHP(address user, uint256 amount) external;
    function levelUp(uint256 tokenId) external;
}
