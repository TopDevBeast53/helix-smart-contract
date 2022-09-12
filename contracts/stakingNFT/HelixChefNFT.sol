// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/IHelixNFT.sol";
import "../interfaces/IFeeMinter.sol";
import "../tokens/HelixToken.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

/// Enable users to stake NFTs and earn rewards
contract HelixChefNFT is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    // Info on each user who has NFTs staked in this contract
    struct UserInfo {
        uint256[] stakedNFTsId;        // Ids of the NFTs this user has staked
        uint256 pendingReward;
        uint256 accruedReward;         // Amount of unwithdrawn rewardToken
        uint256 rewardDebt;
        uint256 stakedNfts;
    }

    /// Owner approved contracts which can accrue user rewards
    EnumerableSetUpgradeable.AddressSet private _accruers;

    /// Instance of HelixNFT
    IHelixNFT public helixNFT;

    /// Token that reward are earned in (HELIX)
    IERC20Upgradeable public rewardToken;

    /// Total number of NFTs staked in this contract
    uint256 public totalStakedWrappedNfts;

    /// Maps a user's address to their info struct
    mapping(address => UserInfo) public users;

    /// Maps a user's address to the number of NFTs they've staked
    mapping(address => uint256) public usersStakedWrappedNfts;

    /// Called to get rewardToken to mint per block
    IFeeMinter public feeMinter;

    /// TODO
    uint256 public accTokenPerShare;

    /// Last block number when rewards were reward
    uint256 public lastUpdateBlock;

    uint256 private constant REWARDS_PRECISION = 1e12;

    uint256 public totalStakedNfts;

    // Emitted when an NFTs are staked
    event Stake(address indexed user, uint256[] tokenIds);

    // Emitted when an NFTs are unstaked
    event Unstake(address indexed user, uint256[] tokenIds);

    // Emitted when a user's transaction results in accrued reward
    event AccrueReward(address indexed user, uint256 accruedReward);

    // Emitted when an accruer is added
    event AddAccruer(address indexed adder, address indexed added);

    // Emitted when an accruer is removed
    event RemoveAccruer(address indexed remover, address indexed removed);

    // Emitted when reward tokens is withdrawn
    event WithdrawRewardToken(address indexed withdrawer, uint256 amount);

    // Emitted when a new helixNFT address is set
    event SetHelixNFT(address indexed setter, address indexed helixNFT);

    // Emitted when a new feeMinter is set
    event SetFeeMinter(address indexed setter, address indexed feeMinter);

    // Emitted when the pool is updated
    event UpdatePool(
        uint256 indexed accTokenPerShare, 
        uint256 indexed lastUpdateBlock, 
        uint256 indexed toMint
    );

    // TODO
    event HarvestRewards(address harvester, uint256 rewards);

    modifier onlyAccruer {
        require(isAccruer(msg.sender), "HelixChefNFT: not an accruer");
        _;
    }

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "HelixChefNFT: zero address");
        _;
    }

    function initialize(
        IHelixNFT _helixNFT, 
        IERC20Upgradeable _rewardToken,
        address _feeMinter
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        helixNFT = _helixNFT;
        rewardToken = _rewardToken;
        feeMinter = IFeeMinter(_feeMinter);
        lastUpdateBlock = block.number;
    }

    /// Stake the tokens with _tokenIds in the pool
    function stake(uint256[] memory _tokenIds) external whenNotPaused nonReentrant {
        uint256 tokenIdsLength = _tokenIds.length; 
        require(tokenIdsLength > 0, "tokenIds length can't be zero");
        
        UserInfo storage user = users[msg.sender];

        harvestRewards();
   
        for (uint256 i = 0; i < tokenIdsLength; i++){
            (address tokenOwner, bool isStaked, uint256 wrappedNfts) = helixNFT.getInfoForStaking(
                _tokenIds[i]
            );

            require(msg.sender == tokenOwner, "HelixChefNFT: not token owner");
            require(!isStaked, "HelixChefNFT: already staked");

            helixNFT.setIsStaked(_tokenIds[i], true);
            user.stakedNFTsId.push(_tokenIds[i]);

            user.stakedNfts += (wrappedNfts > 0) ? wrappedNfts : 1;
            totalStakedNfts += (wrappedNfts > 0) ? wrappedNfts : 1;
        
            usersStakedWrappedNfts[msg.sender] += wrappedNfts;
            totalStakedWrappedNfts += wrappedNfts;
        }

        emit Stake(msg.sender, _tokenIds);
    }

    /// Unstake the tokens with _tokenIds in the pool
    function unstake(uint256[] memory _tokenIds) external whenNotPaused nonReentrant {
        uint256 tokenIdsLength = _tokenIds.length;
        require(tokenIdsLength > 0, "tokenIds length can't be zero");

        UserInfo storage user = users[msg.sender];
        uint256 stakedNfts = user.stakedNfts;
        require(stakedNfts > 0, "caller hasn't staked any nfts");

        harvestRewards();

        for (uint256 i = 0; i < tokenIdsLength; i++){
            (address tokenOwner, bool isStaked, uint256 wrappedNfts) = 
                helixNFT.getInfoForStaking(_tokenIds[i]);

            require(msg.sender == tokenOwner, "HelixChefNFT: not token owner");
            require(isStaked, "HelixChefNFT: already unstaked");

            helixNFT.setIsStaked(_tokenIds[i], false);
            _removeTokenIdFromUser(msg.sender, _tokenIds[i]);

            user.stakedNfts -= (wrappedNfts > 0) ? wrappedNfts : 1;
            totalStakedNfts -= (wrappedNfts > 0) ? wrappedNfts : 1;

            usersStakedWrappedNfts[msg.sender] -= wrappedNfts;
            totalStakedWrappedNfts -= wrappedNfts;
        }

        emit Unstake(msg.sender, _tokenIds);
    }

    /// Accrue reward to the _user's account based on the transaction _fee
    function accrueReward(address _user, uint256 _fee) external onlyAccruer {
        uint256 reward = getAccruedReward(_user, _fee);
        users[_user].accruedReward += reward;
        emit AccrueReward(_user, reward);
    }

    /// Called by the owner to add an accruer
    function addAccruer(address _address) external onlyOwner onlyValidAddress(_address) {
        EnumerableSetUpgradeable.add(_accruers, _address);
        emit AddAccruer(msg.sender, _address);
    }

    /// Called by the owner to remove an accruer
    function removeAccruer(address _address) external onlyOwner {
        require(isAccruer(_address), "HelixChefNFT: not an accruer");
        EnumerableSetUpgradeable.remove(_accruers, _address);
        emit RemoveAccruer(msg.sender, _address);
    }   
    
    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Called by the owner to set the _helixNFT address
    function setHelixNFT(address _helixNFT) external onlyOwner {
        require(_helixNFT != address(0), "HelixChefNFT: zero address");
        helixNFT = IHelixNFT(_helixNFT);
        emit SetHelixNFT(msg.sender, _helixNFT);
    }

    /// Called by the owner to set the _feeMinter address
    function setFeeMinter(address _feeMinter) external onlyOwner {
        require(_feeMinter != address(0), "HelixChefNFT: zero address");
        feeMinter = IFeeMinter(_feeMinter);
        emit SetFeeMinter(msg.sender, _feeMinter);
    }

    /// Return the accruer at _index
    function getAccruer(uint256 _index) external view returns (address) {
        require(_index <= getNumAccruers() - 1, "HelixChefNFT: index out of bounds");
        return EnumerableSetUpgradeable.at(_accruers, _index);
    }

    /// Return the number of NFTs the _user has staked
    function getUsersStakedWrappedNfts(address _user) external view returns(uint256) {
        return usersStakedWrappedNfts[_user];
    }

    function harvestRewards() public {
        updatePool();
        UserInfo storage user = users[msg.sender];

        uint256 rewards = _getRewards(msg.sender);
        uint256 toMint = rewards > user.rewardDebt ? rewards - user.rewardDebt : 0;
        user.rewardDebt = rewards;

        if (toMint <= 0) {
            return;
        }

        user.accruedReward = 0;
        emit HarvestRewards(msg.sender, toMint);
        HelixToken(address(rewardToken)).mint(msg.sender, toMint);
    }

    /// Update the pool
    function updatePool() public {
        if (block.number <= lastUpdateBlock) {
            return;
        }

        if (totalStakedNfts == 0) {
            lastUpdateBlock = block.number;
            emit UpdatePool(accTokenPerShare, lastUpdateBlock, 0);
            return;
        } 

        uint256 blockDelta = block.number - lastUpdateBlock;
        uint256 rewards = blockDelta * getRewardsPerBlock();
        accTokenPerShare = accTokenPerShare + (rewards * REWARDS_PRECISION / totalStakedNfts);
        lastUpdateBlock = block.number;

        emit UpdatePool(accTokenPerShare, lastUpdateBlock, rewards);
    }

    /// Return the _user's pending reward
    function getPendingReward(address _user) public view returns (uint256) {
        UserInfo memory user = users[_user];
   
        uint256 _accTokenPerShare = accTokenPerShare;
        if (block.number > lastUpdateBlock) {
            uint256 blockDelta = block.number - lastUpdateBlock;
            uint256 rewards = blockDelta * getRewardsPerBlock();
            _accTokenPerShare += rewards * REWARDS_PRECISION / totalStakedNfts;
        }
        
        return users[_user].stakedNfts * _accTokenPerShare / REWARDS_PRECISION - user.rewardDebt;
    }

    /// Return the number of added _accruers
    function getNumAccruers() public view returns (uint256) {
        return EnumerableSetUpgradeable.length(_accruers);
    }

    /// Return the reward accrued to _user based on the transaction _fee
    function getAccruedReward(address _user, uint256 _fee) public view returns (uint256) {
        if (totalStakedWrappedNfts == 0) {
            return 0;
        }
        return usersStakedWrappedNfts[_user] * _fee / totalStakedWrappedNfts ;
    }

    /// Return true if the _address is a registered accruer and false otherwise
    function isAccruer(address _address) public view returns (bool) {
        return EnumerableSetUpgradeable.contains(_accruers, _address);
    }

    // Remove _tokenId from _user's account
    function _removeTokenIdFromUser(address _user, uint256 _tokenId) private {
        uint256[] storage tokenIds = users[_user].stakedNFTsId;
        uint256 length = tokenIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (_tokenId == tokenIds[i]) {
                tokenIds[i] = tokenIds[tokenIds.length - 1];
                tokenIds.pop();
                return;
            }
        }
    }

    // Return the toMintPerBlockRate assigned to this contract by the feeMinter
    function getRewardsPerBlock() public view returns (uint256) {
        require(address(feeMinter) != address(0), "HelixChefNFT: fee minter unassigned");
        return feeMinter.getToMintPerBlock(address(this));
    }

    // Return the _user's rewards
    function _getRewards(address _user) private view returns (uint256) {
        return users[_user].stakedNfts * accTokenPerShare / REWARDS_PRECISION;
    }
}
