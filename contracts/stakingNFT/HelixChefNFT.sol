// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IHelixNFT.sol";
import "../tokens/HelixToken.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract HelixChefNFT is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

    // instance of HelixNFT
    IHelixNFT private helixNFT;

    /// Token deposited into this contract
    HelixToken public token;

    // Info of each user who took part in staking
    struct UserInfo {
        // list of staked NFT's ID
        uint[] stakedNFTsId;
        uint accrued; // TODO: accrued Helix from percentage of yield
    }

    uint totalAmountStakedNfts; // TODO:

    // users took part in staking : UserAddress => UserInfo
    mapping (address => UserInfo) public users;

    event StakeTokens(address indexed user, uint[] tokensId);
    event UnstakeToken(address indexed user, uint[] tokensId);

    function initialize(IHelixNFT _helixNFT, HelixToken _token) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        helixNFT = _helixNFT;
        token = _token;
    }

    //Public functions -------------------------------------------------------

    /**
     * @dev staking
     */
    function stake(uint256[] memory tokensId) public nonReentrant {
        _withdrawRewardToken();// --------1
        
        UserInfo storage user = users[msg.sender];

        for(uint256 i = 0; i < tokensId.length; i++){
            (address tokenOwner, bool isStaked) = helixNFT.getInfoForStaking(tokensId[i]);
            _requireIsTokenOwner(msg.sender, tokenOwner);
            require(!isStaked, "HelixChefNFT: already staked");
            helixNFT.setIsStaked(tokensId[i], true);
            user.stakedNFTsId.push(tokensId[i]);// --------2
        }
        emit StakeTokens(msg.sender, tokensId);
    }

    /**
     * @dev unstaking
     */
    function unstake(uint256[] memory tokensId) public nonReentrant {
        
        _withdrawRewardToken();// --------1
        
        for(uint256 i = 0; i < tokensId.length; i++){
            (address tokenOwner, bool isStaked) = helixNFT.getInfoForStaking(tokensId[i]);
            _requireIsTokenOwner(msg.sender, tokenOwner);
            require(isStaked, "HelixChefNFT: already unstaked");
            helixNFT.setIsStaked(tokensId[i], false);
            removeTokenIdFromUsers(tokensId[i], msg.sender);// --------2
        }
        
        emit UnstakeToken(msg.sender, tokensId);
    }

    //External functions -----------------------------------------------------

    /**
     * @dev To get the amount staked by user
     */
    function getAmountStaked(address user) external view returns(uint) {
        return users[user].stakedNFTsId.length;
    }

    /**
     * @dev To withdraw reward token
     */
    function withdrawRewardToken() external nonReentrant {
        _withdrawRewardToken();
    }

    /**
     * @dev See the list of the NFT ids that `_user` has staked
     */
    function getUserStakedTokens(address _user) external view returns(uint[] memory){
        uint[] memory tokensId = new uint[](users[_user].stakedNFTsId.length);
        tokensId = users[_user].stakedNFTsId;
        return tokensId;
    }

    /**
     * @dev See pending Reward on frontend.
     */
    function pendingReward(address _user) external view returns (uint) {
        return users[_user].accrued;
    }

    //internal functions -----------------------------------------------------

    /**
     * @dev Withdraw rewardToken from HelixChefNFT.
     *
     */
    function _withdrawRewardToken() internal {
        uint _amount = users[msg.sender].accrued;
        users[msg.sender].accrued = 0;
        token.transfer(address(msg.sender), _amount);
    }

    /**
     * @dev Remove TokenId to be unstaked from userInfo
     * @param tokenId to be removed
     * @param user who is unstaking
     */
    function removeTokenIdFromUsers(uint256 tokenId, address user) internal {
        uint[] storage tokensId = users[user].stakedNFTsId;
        for (uint256 i = 0; i < tokensId.length; i++) {
            if (tokenId == tokensId[i]) {
                tokensId[i] = tokensId[tokensId.length - 1];
                tokensId.pop();
                return;
            }
        }
    }

    function _requireIsTokenOwner(address caller, address tokenOwner) private pure {
            require(caller == tokenOwner, "HelixChefNFT: not token owner");
    }
}
