// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@rari-capital/solmate/src/tokens/ERC20.sol';
import "../libraries/ExtraMath.sol";
import "../interfaces/IAuraNFT.sol";

contract SmartChefNFT is Ownable, ReentrancyGuard {

    // Total Aura Points staked in Pool across all NFTs by all users.
    uint public totalAuraPoints;
    // Last block that rewards were calculated.
    uint public lastRewardBlock;
    // instance of AuraNFT
    IAuraNFT public auraNFT;

    // Here is a main formula to stake. Basically, any point in time, the amount of rewards entitled to a user but is pending to be distributed is:
    //
    //   pending reward = (user.auraPointAmount * rewardTokens.accCakePerShare) - user.rewardDebt
    //
    // Whenever a user stake/unstake/withdraw. Here's what happens:
    //   1. The RewardToken's `accCakePerShare` (and `lastRewardBlock`) gets updated in `updatePool` function
    //   2. User receives the pending reward sent to user's address.
    //   3. User's `auraPointAmount` (and `totalAuraPoints`) gets updated.
    //   4. User's `rewardDebt` gets updated.

    // Info of each user who took part in staking
    struct UserInfo {
        // list of staked NFT's ID
        uint[] stakedNFTsId;
        // AuraPoint Amount user gain with staked(A auraNFT has auraPoint amount initially)
        uint auraPointAmount;
    }

    // Info of reward token
    struct RewardToken {
        // reward will be accrued per block, must not be zero.
        uint rewardPerBlock;
        // block number which reward token is created.
        uint startBlock;
        // Accumulated Tokens per share, times 1e12.(1e12 is for suming as integer)
        uint accTokenPerShare;
        // true - enable; false - disable
        bool enabled;
    }

    // users took part in staking : UserAddress => UserInfo
    mapping (address => UserInfo) public users;
    // list of reward token's address
    address[] public rewardTokenAddresses;
    // RewardTokenAddress => RewardToken
    mapping (address => RewardToken) public rewardTokens;
    // rewardDebt is for removing duplicated reward that means whatever you’ve already received: UserAddress => (RewardTokenAddress => amount of rewardDebt)
    mapping (address => mapping(address => uint)) public rewardDebt;

    event AddNewRewardToken(address token);
    event DisableRewardToken(address token);
    event ChangeRewardToken(address indexed token, uint rewardPerBlock);
    event StakeTokens(address indexed user, uint amountRB, uint[] tokensId);
    event UnstakeToken(address indexed user, uint amountRB, uint[] tokensId);

    constructor(IAuraNFT _auraNFT, uint _lastRewardBlock) {
        auraNFT = _auraNFT;
        lastRewardBlock = _lastRewardBlock;
    }

    //Public functions -------------------------------------------------------
    
    /**
     * @dev Update reward variables of the pool to be up-to-date.
     *
     * NOTE: - Update `lastRewardBlock` with current block number.
     *       - Update `accTokenPerShare` of all `rewardTokens` to current time.
     */
    function updatePool() public {
        uint _fromLastRewardToNow = getDiffBlock(lastRewardBlock, block.number);
        uint _totalAuraPoints = totalAuraPoints;

        if(_fromLastRewardToNow == 0){
            return;
        }
        lastRewardBlock = block.number;
        if(_totalAuraPoints == 0){
            return;
        }
        for(uint i = 0; i < rewardTokenAddresses.length; i++){
            address _tokenAddress = rewardTokenAddresses[i];
            RewardToken memory curRewardToken = rewardTokens[_tokenAddress];
            if(curRewardToken.enabled == true && curRewardToken.startBlock < block.number){
                uint fromRewardStartToNow = getDiffBlock(curRewardToken.startBlock, block.number);
                uint curMultiplier = ExtraMath.min(fromRewardStartToNow, _fromLastRewardToNow);
                rewardTokens[_tokenAddress].accTokenPerShare += (curRewardToken.rewardPerBlock * curMultiplier * 1e12) / _totalAuraPoints;
            }
        }
    }
    
    /**
     * @dev Withdraw rewardToken from AuraChefNFT.
     *
     * NOTE: 1. updatePool()
     *       2. User receives the pending reward sent to user's address.
     *       3. User's `rewardDebt` gets updated.
     */
    function withdrawRewardToken() public {
        updatePool();// -----1
        UserInfo memory user = users[msg.sender];
        address[] memory _rewardTokenAddresses = rewardTokenAddresses;
        if(user.auraPointAmount == 0){
            return;
        }
        for(uint i = 0; i < _rewardTokenAddresses.length; i++){
            RewardToken memory curRewardToken = rewardTokens[_rewardTokenAddresses[i]];
            uint pending = user.auraPointAmount * curRewardToken.accTokenPerShare / 1e12 - rewardDebt[msg.sender][_rewardTokenAddresses[i]];
            if(pending > 0){
                ERC20(_rewardTokenAddresses[i]).transfer(address(msg.sender), pending);// ------2
                rewardDebt[msg.sender][_rewardTokenAddresses[i]] = user.auraPointAmount * curRewardToken.accTokenPerShare / 1e12;// -----3
            }
        }
    }

    /**
     * @dev staking
     *
     * NOTE: 1. UpdatePool and User receives the pending reward sent to user's address.
     *       2. Push new NFT to be staked
     *       3. User's `auraPointAmount`(and `totalAuraPoints`) gets updated.
     *       4. User's `rewardDebt` gets updated.
     *
     * Requirements:
     *
     * - `tokensId`'s owner must be sender
     * - `tokensId` must be unstaked
     */
    function stake(uint[] calldata tokensId) public nonReentrant {
        
        withdrawRewardToken();// --------1
        
        UserInfo storage user = users[msg.sender];
        uint depositedAPs = 0;
        for(uint i = 0; i < tokensId.length; i++){
            (address tokenOwner, bool isStaked, uint auraPoints) = auraNFT.getInfoForStaking(tokensId[i]);
            require(tokenOwner == msg.sender, "Not token owner");
            require(isStaked == false, "Token has already been staked");
            auraNFT.setIsStaked(tokensId[i], true);
            depositedAPs += auraPoints;
            user.stakedNFTsId.push(tokensId[i]);// --------2
        }
        if(depositedAPs > 0){
            user.auraPointAmount += depositedAPs;// --------3
            totalAuraPoints += depositedAPs;
        }
        _updateRewardDebt(msg.sender);// --------4
        emit StakeTokens(msg.sender, depositedAPs, tokensId);
    }

    /**
     * @dev unstaking
     *
     * NOTE: 1. UpdatePool and User receives the pending reward sent to user's address.
     *       2. Remove NFTs to be unstaked
     *       3. User's `auraPointAmount`(and `totalAuraPoints`) gets updated.
     *       4. User's `rewardDebt` gets updated.
     *
     * Requirements:
     *
     * - `tokensId`'s owner must be sender
     * - `tokensId` must be staked
     */
    function unstake(uint[] calldata tokensId) public nonReentrant {
        
        withdrawRewardToken();// --------1
        
        UserInfo storage user = users[msg.sender];
        uint withdrawalAPs = 0;
        for(uint i = 0; i < tokensId.length; i++){
            (address tokenOwner, bool isStaked, uint auraPoints) = auraNFT.getInfoForStaking(tokensId[i]);
            require(tokenOwner == msg.sender, "Not token owner");
            require(isStaked == true, "Token has already been unstaked");
            auraNFT.setIsStaked(tokensId[i], false);
            withdrawalAPs += auraPoints;
            removeTokenIdFromUsers(tokensId[i], msg.sender);// --------2
        }
        if(withdrawalAPs > 0){
            user.auraPointAmount -= withdrawalAPs;// --------3
            totalAuraPoints -= withdrawalAPs;
        }
        _updateRewardDebt(msg.sender);// --------4
        emit UnstakeToken(msg.sender, withdrawalAPs, tokensId);
    }

    /**
     * @dev Used by owner to add new reward Token
     * @param newToken address of reward Token to be added
     * @param startBlock startBlock of new reward Token
     * @param rewardPerBlock rewardPerBlock of new reward Token
     *
     * Requirements:
     *
     * - `newToken` cannot be the zero address and it must be what doesn't exist.
     * - `rewardPerBlock` cannot be the zero.
     */
    function addNewRewardToken(address newToken, uint startBlock, uint rewardPerBlock) public onlyOwner {
        require(newToken != address(0), "Address shouldn't be 0");
        require(isRewardToken(newToken) == false, "Token is already in the list");
        require(rewardPerBlock != 0, "rewardPerBlock shouldn't be 0");

        rewardTokenAddresses.push(newToken);
        if(startBlock == 0){
            rewardTokens[newToken].startBlock = block.number + 1;
        } else {
            rewardTokens[newToken].startBlock = startBlock;
        }
        rewardTokens[newToken].rewardPerBlock = rewardPerBlock;
        rewardTokens[newToken].enabled = true;

        emit AddNewRewardToken(newToken);
    }

    /**
     * @dev Used by owner to disable rewardToken
     * @param token address of reward Token to be disabled
     * 
     * NOTE: UpdatePool() is required to reward users so far before token is disabled.
     *
     * Requirements:
     * - `token` must exist.
     * - `token` must be enabled.
     */
    function disableRewardToken(address token) public onlyOwner {
        require(isRewardToken(token), "Token not in the list");
        require(rewardTokens[token].enabled == true, "Reward token is already disabled");

        updatePool();
        rewardTokens[token].enabled = false;
        emit DisableRewardToken(token);
    }

    /**
     * @dev Used by owner to enable rewardToken 
     * @param token address of reward Token to be enabled
     * @param startBlock startBlock of reward Token to be enabled
     * @param rewardPerBlock rewardPerBlock of reward Token to be enabled
     *
     * NOTE: UpdatePool() is required to refresh once token is enabled.
     *
     * Requirements:
     *
     * - `token` must exist.
     * - `token` must be diabled.
     * - `rewardPerBlock` cannot be the zero.
     * - `startBlock` must be later than current.
     */
    function enableRewardToken(address token, uint startBlock, uint rewardPerBlock) public onlyOwner {
        require(isRewardToken(token), "Token not in the list");
        require(rewardTokens[token].enabled == false, "Reward token is already enabled");
        require(rewardPerBlock != 0, "rewardPerBlock shouldn't be 0");

        if(startBlock == 0){
            startBlock = block.number + 1;
        }
        require(startBlock >= block.number, "Start block Must be later than current");
        rewardTokens[token].enabled = true;
        rewardTokens[token].startBlock = startBlock;
        rewardTokens[token].rewardPerBlock = rewardPerBlock;
        emit ChangeRewardToken(token, rewardPerBlock);

        updatePool();
    }

    //External functions -----------------------------------------------------
    
    /**
     * @dev See the list of the NFT ids that `_user` has staked
     */
    function getUserStakedTokens(address _user) external view returns(uint[] memory){
        uint[] memory tokensId = new uint[](users[_user].stakedNFTsId.length);
        tokensId = users[_user].stakedNFTsId;
        return tokensId;
    }

    /**
     * @dev See AuraPoint Amount by `_user`
     */
    function getUserAuraPointAmount(address _user) external view returns(uint){
        return users[_user].auraPointAmount;
    }

    /**
     * @dev See the list of Reward Tokens
     */
    function getListRewardTokens() external view returns(address[] memory){
        address[] memory list = new address[](rewardTokenAddresses.length);
        list = rewardTokenAddresses;
        return list;
    }

    /**
     * @dev See pending Reward on frontend.
     */
    function pendingReward(address _user) external view returns (address[] memory, uint[] memory) {
        UserInfo memory user = users[_user];
        uint[] memory rewards = new uint[](rewardTokenAddresses.length);
        if(user.auraPointAmount == 0){
            return (rewardTokenAddresses, rewards);
        }
        uint _totalAuraPoints = totalAuraPoints;
        uint _fromLastRewardToNow = getDiffBlock(lastRewardBlock, block.number);
        uint _accTokenPerShare = 0;
        for(uint i = 0; i < rewardTokenAddresses.length; i++){
            address _tokenAddress = rewardTokenAddresses[i];
            RewardToken memory curRewardToken = rewardTokens[_tokenAddress];
            if (_fromLastRewardToNow != 0 && _totalAuraPoints != 0 && curRewardToken.enabled == true) {
                uint fromRewardStartToNow = getDiffBlock(curRewardToken.startBlock, block.number);
                uint curMultiplier = ExtraMath.min(fromRewardStartToNow, _fromLastRewardToNow);
                _accTokenPerShare = curRewardToken.accTokenPerShare + (curMultiplier * curRewardToken.rewardPerBlock * 1e12 / _totalAuraPoints);
            } else {
                _accTokenPerShare = curRewardToken.accTokenPerShare;
            }
            rewards[i] = (user.auraPointAmount * _accTokenPerShare / 1e12) - rewardDebt[_user][_tokenAddress];
        }
        return (rewardTokenAddresses, rewards);
    }

    //internal functions -----------------------------------------------------

    /**
     * @dev check if `token` is RewardToken
     * @return true if so, false otherwise.
     */
    function isRewardToken(address token) internal view returns(bool){
        return rewardTokens[token].rewardPerBlock != 0;
    }
    
    /**
     * @dev Return difference block between _from and _to
     */
    function getDiffBlock(uint _from, uint _to) internal pure returns (uint) {
        if(_to > _from)
            return _to - _from;
        else
            return 0;
    }
    
    /**
     * @dev Update RewardDebt by user who is staking
     *
     * NOTE: Why divided by 1e12 is that `accTokenPerShare` is the value multiplied by 1e12.
     */
    function _updateRewardDebt(address _user) internal {
        for(uint i = 0; i < rewardTokenAddresses.length; i++){
            rewardDebt[_user][rewardTokenAddresses[i]] = users[_user].auraPointAmount * rewardTokens[rewardTokenAddresses[i]].accTokenPerShare / 1e12;
        }
    }

    /**
     * @dev Remove TokenId to be unstaked from userInfo
     * @param tokenId to be removed
     * @param user who is unstaking
     */
    function removeTokenIdFromUsers(uint tokenId, address user) internal {
        uint[] storage tokensId = users[user].stakedNFTsId;
        for (uint i = 0; i < tokensId.length; i++) {
            if (tokenId == tokensId[i]) {
                tokensId[i] = tokensId[tokensId.length - 1];
                tokensId.pop();
                return;
            }
        }
    }
}