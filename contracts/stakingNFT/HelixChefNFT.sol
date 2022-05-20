// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IHelixNFT.sol";
import "../tokens/HelixToken.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract HelixChefNFT is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // Info on each user who has NFTs staked in this contract
    struct UserInfo {
        uint[] stakedNFTsId;        // Ids of the NFTs this user has staked
        uint accrued;               // TODO: Accrued but unwithdrawn from percentage of yield
    }

    // Instance of HelixNFT
    IHelixNFT private helixNFT;

    /// Token deposited into this contract
    HelixToken public token;

    /// Total number of NFTs staked in this contract
    uint totalAmountStakedNfts; // TODO:

    /// Maps a user's address to their info struct
    mapping (address => UserInfo) public users;

    // Emitted when an NFTs are staked
    event StakeTokens(address indexed user, uint256[] tokenIds);

    // Emitted when an NFTs are unstaked
    event UnstakeTokens(address indexed user, uint256[] tokenIds);

    function initialize(IHelixNFT _helixNFT, HelixToken _token) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        helixNFT = _helixNFT;
        token = _token;
    }

    /// Stake the tokens with _tokenIds in the pool
    function stake(uint256[] memory _tokenIds) external whenNotPaused nonReentrant {
        _withdrawRewardToken();
        
        UserInfo storage user = users[msg.sender];

        for(uint256 i = 0; i < _tokenIds.length; i++){
            (address tokenOwner, bool isStaked) = helixNFT.getInfoForStaking(_tokenIds[i]);
            _requireIsTokenOwner(msg.sender, tokenOwner);
            require(!isStaked, "HelixChefNFT: already staked");

            helixNFT.setIsStaked(_tokenIds[i], true);
            user.stakedNFTsId.push(_tokenIds[i]);
        }

        emit StakeTokens(msg.sender, _tokenIds);
    }

    /// Unstake the tokens with _tokenIds in the pool
    function unstake(uint256[] memory _tokenIds) external whenNotPaused nonReentrant {
        _withdrawRewardToken();
        
        for(uint256 i = 0; i < _tokenIds.length; i++){
            (address tokenOwner, bool isStaked) = helixNFT.getInfoForStaking(_tokenIds[i]);
            _requireIsTokenOwner(msg.sender, tokenOwner);
            require(isStaked, "HelixChefNFT: already unstaked");

            helixNFT.setIsStaked(_tokenIds[i], false);
            _removeTokenIdFromUsers(_tokenIds[i], msg.sender);
        }
        
        emit UnstakeTokens(msg.sender, _tokenIds);
    }

    /// Return the number of NFTs the _user has staked
    function getAmountStaked(address _user) external view returns(uint) {
        return users[_user].stakedNFTsId.length;
    }

    /// Withdraw accrued reward token
    function withdrawRewardToken() external nonReentrant {
        _withdrawRewardToken();
    }
    
    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Return the array of NFT ids that _user has staked
    function getUserStakedTokens(address _user) external view returns(uint[] memory){
        uint[] memory tokenIds = new uint[](users[_user].stakedNFTsId.length);
        tokenIds = users[_user].stakedNFTsId;
        return tokenIds;
    }

    /// Return the _user's pending reward
    function pendingReward(address _user) external view returns (uint) {
        return users[_user].accrued;
    }
    // Withdraw accrued reward token
    function _withdrawRewardToken() internal {
        uint _amount = users[msg.sender].accrued;
        users[msg.sender].accrued = 0;
        token.transfer(address(msg.sender), _amount);
    }

    // Remove _tokenId from _user's account
    function _removeTokenIdFromUsers(uint256 _tokenId, address _user) private {
        uint[] storage tokenIds = users[_user].stakedNFTsId;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (_tokenId == tokenIds[i]) {
                tokenIds[i] = tokenIds[tokenIds.length - 1];
                tokenIds.pop();
                return;
            }
        }
    }

    // Require that _caller is _tokenOwner
    function _requireIsTokenOwner(address _caller, address _tokenOwner) private pure {
            require(_caller == _tokenOwner, "HelixChefNFT: not token owner");
    }
}
