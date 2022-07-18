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
        uint256 pendingReward;         // Amount of unwithdrawn rewardToken
        uint256 rewardDebt;
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
    uint256 public lastRewardBlock;

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
        uint256 indexed lastRewardBlock, 
        uint256 indexed toMint
    );

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
        lastRewardBlock = block.number;
    }

    /// Stake the tokens with _tokenIds in the pool
    function stake(uint256[] memory _tokenIds) external whenNotPaused nonReentrant {
        _withdrawRewardToken();
        
        UserInfo storage user = users[msg.sender];
    
        uint256 length = _tokenIds.length; 
        for (uint256 i = 0; i < length; i++){
            (address tokenOwner, bool isStaked, uint256 wrappedNFTs) = helixNFT.getInfoForStaking(_tokenIds[i]);
            _requireIsTokenOwner(msg.sender, tokenOwner);
            require(!isStaked, "HelixChefNFT: already staked");

            helixNFT.setIsStaked(_tokenIds[i], true);
            user.stakedNFTsId.push(_tokenIds[i]);

            usersStakedWrappedNfts[msg.sender] += wrappedNFTs;
            totalStakedWrappedNfts += wrappedNFTs;
        }

        emit Stake(msg.sender, _tokenIds);
    }

    /// Unstake the tokens with _tokenIds in the pool
    function unstake(uint256[] memory _tokenIds) external whenNotPaused nonReentrant {
        _withdrawRewardToken();

        uint256 length = _tokenIds.length; 
        for (uint256 i = 0; i < length; i++){
            (address tokenOwner, bool isStaked, uint256 wrappedNFTs) = helixNFT.getInfoForStaking(_tokenIds[i]);
            _requireIsTokenOwner(msg.sender, tokenOwner);
            require(isStaked, "HelixChefNFT: already unstaked");

            helixNFT.setIsStaked(_tokenIds[i], false);
            _removeTokenIdFromUser(msg.sender, _tokenIds[i]);

            usersStakedWrappedNfts[msg.sender] -= wrappedNFTs;
            totalStakedWrappedNfts -= wrappedNFTs;
        }
        
        emit Unstake(msg.sender, _tokenIds);
    }

    /// Accrue reward to the _user's account based on the transaction _fee
    function accrueReward(address _user, uint256 _fee) external onlyAccruer {
        uint256 reward = getAccruedReward(_user, _fee);
        if (reward > 0) {
            users[_user].pendingReward += reward;
            emit AccrueReward(_user, reward);
        }
    }

    /// Withdraw accrued reward token
    function withdrawRewardToken() external nonReentrant {
        _withdrawRewardToken();
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

    // Return the toMintPerBlock rate assigned to this contract by the feeMinter
    function getToMintPerBlock() external view returns (uint256) {
        return _getToMintPerBlock();
    }

    /// Return the _user's pending reward
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo memory user = users[_user];

        uint256 rewardTokenBalance = _getContractRewardTokenBalance();
        uint256 toMint = _getToMint();
        uint256 _accTokenPerShare = _getAccTokenPerShare(toMint, rewardTokenBalance);

        // TODO - check if .length correctly relates to user.amount in masterChef
        return user.stakedNFTsId.length * _accTokenPerShare / 1e12 - user.rewardDebt;
    }

    /// Update the pool
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }

        uint256 rewardTokenBalance = _getContractRewardTokenBalance();
        if (rewardTokenBalance <= 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 toMint = _getToMint();
        accTokenPerShare = _getAccTokenPerShare(toMint, rewardTokenBalance);
        lastRewardBlock = block.number;

        HelixToken(address(rewardToken)).mint(address(this), toMint);
        emit UpdatePool(accTokenPerShare, lastRewardBlock, toMint);
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

    // Withdraw accrued reward token
    function _withdrawRewardToken() private {
        uint256 _amount = users[msg.sender].pendingReward;
        users[msg.sender].pendingReward = 0;
        rewardToken.safeTransfer(address(msg.sender), _amount);
        emit WithdrawRewardToken(msg.sender, _amount);
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

    // Require that _caller is _tokenOwner
    function _requireIsTokenOwner(address _caller, address _tokenOwner) private pure {
            require(_caller == _tokenOwner, "HelixChefNFT: not token owner");
    }

    // Return the toMintPerBlockRate assigned to this contract by the feeMinter
    function _getToMintPerBlock() private view returns (uint256) {
        require(address(feeMinter) != address(0), "HelixChefNFT: fee minter unassigned");
        return feeMinter.getToMintPerBlock(address(this));
    }

    // Return this contract's rewardToken balance
    function _getContractRewardTokenBalance() private view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    // Return the amount reward token to reward
    function _getToMint() private view returns (uint256) {
        if (block.number <= lastRewardBlock || _getContractRewardTokenBalance() <= 0) {
            return 0;
        }
        return _getBlockDelta(lastRewardBlock, block.number) * _getToMintPerBlock();
    }

    // Return the accumulated reward token per share since the last block reward
    function _getAccTokenPerShare(uint256 _amount, uint256 _balance) private view returns (uint256) {
        return accTokenPerShare + (_amount * 1e12 / _balance);
    }

    // Return the delta between _from and _to blocks
    function _getBlockDelta(uint256 _from, uint256 _to) private pure returns (uint256) {
        return _to - _from;
    }
}
