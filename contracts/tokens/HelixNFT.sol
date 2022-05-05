// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract HelixNFT is ERC721EnumerableUpgradeable {
    using Strings for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    address private _owner;
    uint256 private _reentrancyStatus;

    // Maximum length of tokens per request
    uint256 public constant MAX_ARRAY_LENGTH_PER_REQUEST = 30;

    /**
     * @dev Stakers who can change attribute `isStaked` of token
     *
     * NOTE : Stakers would be HelixChefNFT contract
     */
    EnumerableSet.AddressSet private _stakers;

    /**
     * @dev Minters who can mint token
     * 
     * NOTE : Minters would be address of Whitelist for Presale Or Launchpad contract address for Sale
     */
    EnumerableSet.AddressSet private _minters;

    /**
     * @dev Accruers who can accrue HelixPoints to users
     *
     * NOTE : Accruers would be SwapRewards contract
     */
    EnumerableSet.AddressSet private _accruers;

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    string private _internalBaseURI;

    /**
     * @dev Last NFT token id, it's increasing on mint
     */
    uint256 private _lastTokenId;
    
    /**
     * @dev A HelixNFT has Helix Points amount initially when it is minted
     *
     * NOTE : Set its value when deploy this contract
     */
    uint256 private _initialHelixPoints;

    /**
     * @dev When level up, add a percentage of your previous HelixPoints.
     */
    uint8 private _levelUpPercent; 

    //User can upgrade a NFT which he/she wants to boost, it needs to put certain Amount of Helix Points in the NFT.

    //e.g.
    //   To upgrade 1st level NFT to 2nd level, the user needs to have 10 Helix Points in the token
    //   To upgrade 2nd level NFT to 3rd level, the user needs to have 50 Helix Points in the token
    //   To upgrade 3rd level NFT to 4th level, the user needs to have 100 Helix Points in the token
    //   To upgrade 4th level NFT to 5th level, the user needs to have 200 Helix Points in the token
    //   To upgrade 5th level NFT to 6th level, the user needs to have 500 Helix Points in the token

    /**
     * @dev List of HelixPoints amount limits that a NFT can have by level
     */
    uint[7] private _helixPointsTable;

    /**
     * @dev Structure for attributes the Helix NFTs
     */
    struct Token {
        // ID of the bridged NFT.
        string externalTokenID;
        // External token URI to use.
        string tokenURI;

        // Helix Point is a “power” of your NFT and a tool that helps you to boost your NFT and earn more crypto
        uint256 helixPoints;
        // Helix NFT consists of on a particular level:
        uint256 level;
        // Timestamp the token is minted(block's timestamp)
        uint256 createTimestamp;

        // True if staked, false otherwise
        bool isStaked;
    }

    // map token info by token ID : TokenId => Token
    mapping(uint256 => Token) private _tokens;
    // map accrued HelixPoints by user address : userAddress => accumulated HelixPoints amount
    mapping(address => uint) private _accumulatedHP;

    // event when any tokenId gain HelixPoints 
    event AccrueHelixPoints(address indexed tokenId, uint256 amount);
    // event when an user level up from which tokenId
    event LevelUp(address indexed user, uint256 indexed newLevel, uint256 tokenId);
    event Initialize(string baseURI, uint256 initialHelixPoints);
    event TokenMint(address indexed to, uint256 indexed tokenId, uint256 level, uint256 helixPoints);

    modifier isNotZeroAddress(address _address) {
        require(_address != address(0), "HelixNFT: zero address");
        _;
    }

    modifier tokenIdExists(uint256 tokenId) {
        require(_exists(tokenId), "HelixNFT: nonexistent token");
        _;
    }

    modifier isNotZero(uint256 amount) {
        require(amount > 0, "HelixNFT: zero amount");
        _;
    }

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    function initialize(
        string memory baseURI,
        uint256 initialHelixPoints,
        uint8 levelUpPercent
    ) external initializer {
        _owner = msg.sender;
        _reentrancyStatus = 1;

        __ERC721_init("Helix NFT", "HELIX-NFT");
        __ERC721Enumerable_init();

        _internalBaseURI = baseURI;
        _initialHelixPoints = initialHelixPoints;
        _levelUpPercent = levelUpPercent;

        _helixPointsTable[0] = 100 ether;//it means nothing because level start from `1 LEVEL`
        _helixPointsTable[1] = 10 ether;
        _helixPointsTable[2] = 50 ether;
        _helixPointsTable[3] = 100 ether;
        _helixPointsTable[4] = 200 ether;
        _helixPointsTable[5] = 500 ether;
        _helixPointsTable[6] = 10000 ether;

        emit Initialize(baseURI, initialHelixPoints);
    }
    
    //Public functions --------------------------------------------------------------------------------------------

    /**
     * @dev See {ERC721-tokenURI}.
     */
    function tokenURI(uint256 id) public view override tokenIdExists(id) returns (string memory) {
        return string(abi.encodePacked(_tokens[id].tokenURI));
    }

    /**
     * @dev Override funtion to avoid the approval of the staked token
     */
    function approve(address to, uint256 tokenId) public override {
        if (_tokens[tokenId].isStaked) {
            revert("ERC721: Token is staked");
        }
        super.approve(to, tokenId);
    }

    //Internal functions --------------------------------------------------------------------------------------------

    /**
     * @dev Override funtion to avoid the transfer of the staked token
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721EnumerableUpgradeable) {
        if (_tokens[tokenId].isStaked) {
            revert("ERC721: Token is staked");
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    //External functions --------------------------------------------------------------------------------------------

    /**
     * @dev To mint HelixNFT
     *
     * Initialize:
     *      set helixPoints as initialHelixPoints value
     *      set level as 1 (start from 1 LEVEL)
     */
    function mint(address to) public onlyMinter nonReentrant isNotZeroAddress(to) {
        _lastTokenId += 1;
        uint256 tokenId = _lastTokenId;
        _tokens[tokenId].helixPoints = _initialHelixPoints;
        _tokens[tokenId].createTimestamp = block.timestamp;
        _tokens[tokenId].level = 1;
        _safeMint(to, tokenId);
    }

    // Mints external NFT
    function mintExternal(address to, string calldata externalTokenID, string calldata uri) 
        public 
        onlyMinter 
        nonReentrant 
        isNotZeroAddress(to) 
    {
        _lastTokenId += 1;
        uint256 tokenId = _lastTokenId;
        _tokens[tokenId].helixPoints = _initialHelixPoints;
        _tokens[tokenId].createTimestamp = block.timestamp;
        _tokens[tokenId].level = 1;
        _tokens[tokenId].externalTokenID = externalTokenID;
        _tokens[tokenId].tokenURI = uri;
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) external nonReentrant {
        _burn(tokenId);
    }
    
    /**
     * @dev To get token IDs of user by address
     */
    function getTokenIdsOfOwner(address user) external view returns (uint[] memory) {
        uint256 balance = ERC721Upgradeable.balanceOf(user);
        require(balance > 0, "HelixNFT: insufficient balance");
        uint[] memory tokenIds = new uint[](balance);
        for (uint256 index = 0; index < balance; index++) {
            tokenIds[index] = tokenOfOwnerByIndex(user, index);
        }
        return tokenIds;
    }

    /**
     * @dev To get the last token Id
     */
    function getLastTokenId() external view returns (uint) {
        return _lastTokenId;
    }

    /**
     * @dev External funtion to upgrade `tokenId` to the next level
     *
     * NOTE: When level up, it's added a `_levelUpPercent` percentage of your previous HelixPoints
     *
     * Requirements:
     * - The current token level must be valid.
     * - The current held HelixPoints amount must be sufficient.
     */
    function levelUp(uint256 tokenId) external onlyStaker {
        Token storage token = _tokens[tokenId];
        uint256 curLevel = token.level;
        require(curLevel > 0 && curLevel < 7, "HelixNFT: invalid level");
        uint256 curHelixPoints = token.helixPoints;
        require(_helixPointsTable[curLevel] == curHelixPoints, "HelixNFT: insufficient points");

        token.level = curLevel + 1;
        token.helixPoints = curHelixPoints + (curHelixPoints * _levelUpPercent) / 100;

        emit LevelUp(msg.sender, (curLevel + 1), tokenId);
    }
    
    /**
     * @dev Returns (HelixPoints amount to upgrade to the next level - current HP amount)
     */
    function remainHPToNextLevel(uint256 tokenId) external view returns (uint) {
        return _remainHPToNextLevel(tokenId);
    }

    /**
     * @dev See accumulated HelixPoints amount by `user`
     */
    function getAccumulatedHP(address user) external view returns (uint) {
        return _accumulatedHP[user];
    }

    /**
     * @dev Set accumulated HelixPoints amount of `user`
     */
    function setAccumulatedHP(address user, uint256 amount) external onlyStaker isNotZero(amount) {
        _accumulatedHP[user] = amount;
    }

    /**
     * @dev Used by accruer to accrue HelixPoints `amount` to `user`
     *
     * NOTE: It would be called by swap contract(accruer).
     *       An user can accumulate HelixPoints as a reward when Swapping
     */
    function accruePoints(address user, uint256 amount) external onlyAccruer isNotZero(amount) {
        _accumulatedHP[user] += amount;
        emit AccrueHelixPoints(user, amount);
    }
    
    /**
     * @dev External function to get the information of `tokenId`
     */
    function getToken(uint256 _tokenId) 
        external 
        view
        tokenIdExists(_tokenId)
        returns (
            uint256 tokenId,
            address tokenOwner,
            uint256 level,
            uint256 helixPoints,
            uint256 remainHPToNextLvl,
            bool isStaked,
            uint256 createTimestamp,
            string memory externalTokenID,
            string memory uri
        )
    {
        Token memory token = _tokens[_tokenId];
        tokenId = _tokenId;
        tokenOwner = ownerOf(_tokenId);
        level = token.level;
        helixPoints = token.helixPoints;
        remainHPToNextLvl = _remainHPToNextLevel(_tokenId);
        isStaked = token.isStaked;
        createTimestamp = token.createTimestamp;
        externalTokenID = token.externalTokenID;
        uri = tokenURI(_tokenId);
    }

    function getExternalTokenID(uint256 _tokenId) external view tokenIdExists(_tokenId) returns (string memory) {
        return _tokens[_tokenId].externalTokenID;
    }

    /**
     * @dev External function to get helixPoints by `tokenId`
     */
    function getHelixPoints(uint256 tokenId) external view returns (uint) {
        return _tokens[tokenId].helixPoints;
    }

    /**
     * @dev External function to set helixPoints by `tokenId`
     */
    function setHelixPoints(uint256 tokenId, uint256 amount) external onlyStaker isNotZero(amount) {
        _tokens[tokenId].helixPoints = amount;
    }

    /**
     * @dev Returns the owner address and staked status among the token information with the given 'tokenId'.
     * 
     * HelixChefNFT's `stake` function calls it to get token's information by token ID
     */
    function getInfoForStaking(uint256 tokenId) 
        external 
        view 
        tokenIdExists(tokenId) 
        returns (address tokenOwner, bool isStaked, uint256 helixPoints) 
    {
        tokenOwner = ownerOf(tokenId);
        isStaked = _tokens[tokenId].isStaked;
        helixPoints = _tokens[tokenId].helixPoints;
    }

    /**
     * @dev External function to get level by `tokenId`
     */
    function getLevel(uint256 tokenId) external view returns (uint) {
        return _tokens[tokenId].level;
    }

    /** 
     * @dev Set to set Base URI
     * @param tokenId uint256 ID of the token to be staked/unstaked
     * @param isStaked bool whether to being staked or not
     *
     * HelixChefNFT's `stake` function calls it to set staked status into token's info by token ID
     * 
     * NOTE: - Staked token can't be transferred to anyone
     *       - Staker would be HelixChefNFT contract
     */
    function setIsStaked(uint256 tokenId, bool isStaked) external onlyStaker tokenIdExists(tokenId) {
        if (isStaked) {
            // Clear approval for not to transfer when staked token 
            _approve(address(0), tokenId);
        }
        _tokens[tokenId].isStaked = isStaked;
    }

    /**
     * @dev External function to set new Base URI
     */
    function setBaseURI(string calldata newBaseUri) external onlyOwner {
        _internalBaseURI = newBaseUri;
    }

    /**
     * @dev External function to set HelixPointsTable
     */
    function setHelixPointsTable(uint[7] calldata hpTable) external onlyOwner {
        _helixPointsTable = hpTable;
    }

    /**
     * @dev External function to set LevelUpPercent
     *
     * NOTE: percentage value: e.g. 10%
     */
    function setLevelUpPercent(uint8 percent) external onlyOwner isNotZero(percent) {
        _levelUpPercent = percent;
    }

    /**
     * @dev Returns (HelixPoints amount to upgrade to the next level - current HP amount)
     */
    function _remainHPToNextLevel(uint256 tokenId) internal view returns (uint) {
        return _helixPointsTable[uint(_tokens[tokenId].level)] - _tokens[tokenId].helixPoints;
    }

    //Role functions for Staker --------------------------------------------------------------------------------------

    /**
     * @dev used by owner to add staker who changes `isStaked` of token
     * @param _addStaker address of staker to be added.
     * @return true if successful.
     */
    function addStaker(address _addStaker) public onlyOwner isNotZeroAddress(_addStaker) returns (bool) {
        return EnumerableSet.add(_stakers, _addStaker);
    }

    /**
     * @dev used by owner to delete staker who changes `isStaked` of token
     * @param _delStaker address of staker to be deleted.
     * @return true if successful.
     */
    function delStaker(address _delStaker) external onlyOwner isNotZeroAddress(_delStaker) returns (bool) {
        return EnumerableSet.remove(_stakers, _delStaker);
    }

    /**
     * @dev See the number of stakers
     * @return number of stakers.
     */
    function getStakerLength() public view returns (uint256) {
        return EnumerableSet.length(_stakers);
    }

    /**
     * @dev Check if an address is a staker
     * @return true or false based on staker status.
     */
    function isStaker(address account) public view returns (bool) {
        return EnumerableSet.contains(_stakers, account);
    }

    /**
     * @dev Get the staker at n location
     * @param _index index of address set
     * @return address of staker at index.
     */
    function getStaker(uint256 _index)
        external
        view
        onlyOwner
        returns (address)
    {
        require(_index <= getStakerLength() - 1, "HelixNFT: index out of bounds");
        return EnumerableSet.at(_stakers, _index);
    }

    /**
     * @dev Modifier for changing `isStaked` of token
     */
    modifier onlyStaker() {
        require(isStaker(msg.sender), "HelixNFT: not staker");
        _;
    }

    //Role functions for Minter --------------------------------------------------------------------------------------

    /**
     * @dev used by owner to add minter who can mint
     * @param _addMinter address of minter to be added.
     * @return true if successful.
     */
    function addMinter(address _addMinter) public onlyOwner isNotZeroAddress(_addMinter) returns (bool) {
        return EnumerableSet.add(_minters, _addMinter);
    }

    /**
     * @dev used by owner to delete minter
     * @param _delMinter address of minter to be deleted.
     * @return true if successful.
     */
    function delMinter(address _delMinter) external onlyOwner isNotZeroAddress(_delMinter) returns (bool) {
        return EnumerableSet.remove(_minters, _delMinter);
    }

    /**
     * @dev See the number of minters
     * @return number of minters.
     */
    function getMinterLength() public view returns (uint256) {
        return EnumerableSet.length(_minters);
    }

    /**
     * @dev Check if an address is a minter
     * @return true or false based on minter status.
     */
    function isMinter(address account) public view returns (bool) {
        return EnumerableSet.contains(_minters, account);
    }

    /**
     * @dev Get the minter at n location
     * @param _index index of address set
     * @return address of minter at index.
     */
    function getMinter(uint256 _index)
        external
        view
        onlyOwner
        returns (address)
    {
        require(_index <= getMinterLength() - 1, "HelixNFT: index out of bounds");
        return EnumerableSet.at(_minters, _index);
    }

    /**
     * @dev Modifier
     */
    modifier onlyMinter() {
        require(isMinter(msg.sender), "HelixNFT: not minter");
        _;
    }

    //Role functions for Accruer --------------------------------------------------------------------------------------

    /**
     * @dev used by owner to add accruer who can accrue HelixPoint to users
     * @param _addAccruer address of accruer to be added.
     * @return true if successful.
     */
    function addAccruer(address _addAccruer) public onlyOwner isNotZeroAddress(_addAccruer) returns (bool) {
        return EnumerableSet.add(_accruers, _addAccruer);
    }

    /**
     * @dev used by owner to delete accruer who can accrue HelixPoint to users
     * @param _delAccruer address of accruer to be deleted.
     * @return true if successful.
     */
    function delAccruer(address _delAccruer) external onlyOwner isNotZeroAddress(_delAccruer) returns (bool) {
        return EnumerableSet.remove(_accruers, _delAccruer);
    }

    /**
     * @dev See the number of accruers
     * @return number of accruers.
     */
    function getAccruerLength() public view returns (uint256) {
        return EnumerableSet.length(_accruers);
    }

    /**
     * @dev Check if an address is a accruer
     * @return true or false based on accruer status.
     */
    function isAccruer(address account) public view returns (bool) {
        return EnumerableSet.contains(_accruers, account);
    }

    /**
     * @dev Get the accruer at n location
     * @param _index index of address set
     * @return address of accruer at index.
     */
    function getAccruer(uint256 _index) external view onlyOwner returns (address)
    {
        require(_index <= getAccruerLength() - 1, "HelixNFT: index out of bounds");
        return EnumerableSet.at(_accruers, _index);
    }

    /**
     * @dev Modifier
     */
    modifier onlyAccruer() {
        require(isAccruer(msg.sender), "HelixNFT: not accruer");
        _;
    }

    // Ownable Class ---------------------------------------------------------------
    
    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == msg.sender, "HelixNFT: not owner");
        _;
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner isNotZeroAddress(newOwner) {
        _owner = newOwner;
    }

    // ReentrancyGuard ---------------------------------------------------------------

    modifier nonReentrant() {
        require(_reentrancyStatus == 1, "HelixNFT: reentrancy");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }
}
