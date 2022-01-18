// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract AuraNFT is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @dev Stakers who can change attribute `isStaked` of token
     *
     * NOTE : Stakers would be AuraChefNFT contract
     */
    EnumerableSet.AddressSet private _stakers;

    /**
     * @dev Minters who can mint token
     * 
     * NOTE : Minters would be address of Whitelist for Presale Or Launchpad contract address for Sale
     */
    EnumerableSet.AddressSet private _minters;

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    string private _internalBaseURI;

    /**
     * @dev Last NFT token id, it's increasing on mint
     */
    uint private _lastTokenId;
    
    /**
     * @dev A AuraNFT has Aura Points amount initially when it is minted
     *
     * NOTE : Set its value when deploy this contract
     */
    uint private _initialAuraPoints;

    /**
     * @dev When level up, add a percentage to the sum of your previous AuraPoints.
     *
     * NOTE : Set its value when deploy this contract
     */
    uint8 private _levelUpPercent; 

    
    //NFTs of the first 5 levels can be exchanged for NFTs of the next level by collecting a certain number of the most pumped NFTs of a certain level.

    //e.g.
    //   To get one NFT of the 2nd level, the user needs to have 6 NFTs of the 1st level with 10 Aura Points.
    //   To get one NFT of the 3rd level, the user needs to have 5 NFTs of the 2nd level, with 100 Aura Points.
    //   To get one NFT of the 4th level, the user needs to have 4 NFTs of the 3rd level, with 1000 Aura Points.
    //   To get one NFT of the 5th level, the user needs to have 3 NFTs of the 4th level, with 10,000 Aura Points.
    //   To get one NFT of the 6th level, the user needs to have 2 NFTs of the 5th level, with 50,000 Aura Points.

    // When upgrading the level, the lower-level NFTs are permanently burned out.
    // e.g. a user upgrades 6 NFTs of the first level to 1 NFT of the 2nd level. 
    //      In this case, the 6 NFTs of the first level are permanently burned out.

    /**
     * @dev List of AuraPoints amount limits that a NFT can have by level
     */
    uint[7] private _auraPointsTable;
    
    /**
     * @dev List of NFTs' amount be exchanged for NFTs of the next level
     */
    uint[7] private _levelTable;

    /**
     * @dev Structure for attributes the Aura NFTs
     */
    struct Token {
        // Aura Point is a “power” of your NFT and a tool that helps you to boost your NFT and earn more crypto
        uint auraPoints;
        // Aura NFT consists of on a particular level:
        uint level;
        // True if staked, false otherwise
        bool isStaked;
        // Timestamp the token is minted(block's timestamp)
        uint createTimestamp;
    }

    // map token info by token ID : TokenId => Token
    mapping(uint256 => Token) private _tokens;

    // event when any tokenId gain AuraPoints 
    event GainRB(uint indexed tokenId, uint newAP);
    // event when an user receive AuraPoints
    event RBAccrued(address user, uint amount);
    // event when an user level up from which tokenId
    event LevelUp(address indexed user, uint indexed newLevel, uint[] parentsTokensId);
    event Initialize(string baseURI, uint initialAuraPoints);
    event TokenMint(address indexed to, uint indexed tokenId, uint level, uint auraPoints);


    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor (
        string memory baseURI,
        uint initialAuraPoints,
        uint8 levelUpPercent
    ) ERC721(/*name=*/'Aura NFT', /*symbol=*/'AURA-NFT') {
        
        _internalBaseURI = baseURI;
        _initialAuraPoints = initialAuraPoints;
        _levelUpPercent = levelUpPercent;

        _auraPointsTable[0] = 100 ether;//it means nothing because level start from `1 LEVEL`
        _auraPointsTable[1] = 10 ether;
        _auraPointsTable[2] = 100 ether;
        _auraPointsTable[3] = 1000 ether;
        _auraPointsTable[4] = 10000 ether;
        _auraPointsTable[5] = 50000 ether;
        _auraPointsTable[6] = 150000 ether;

        _levelTable[0] = 0;//it means nothing because level start from `1 LEVEL`
        _levelTable[1] = 6;
        _levelTable[2] = 5;
        _levelTable[3] = 4;
        _levelTable[4] = 3;
        _levelTable[5] = 2;
        _levelTable[6] = 0;

        //BNF-01, SFR-01
        emit Initialize(baseURI, initialAuraPoints);
    }
    
    //Public functions --------------------------------------------------------------------------------------------

    /**
     * @dev See {ERC721-tokenURI}.
     */
    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_exists(id), "ERC721Metadata: URI query for nonexistent token");

        return bytes(_internalBaseURI).length > 0 ? string(abi.encodePacked(_internalBaseURI, id.toString())) : "";
    }

    function mint(address to, uint256 tokenId) public onlyMinter nonReentrant {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public nonReentrant {
        _burn(tokenId);
    }

    function safeMint(address to, uint256 tokenId) public nonReentrant {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory data
    ) public nonReentrant {
        _safeMint(to, tokenId, data);
    }
    
    //External functions --------------------------------------------------------------------------------------------

    /**
     * @dev External function to get auraPoints by `tokenId`
     */
    function getAuraPoints(uint tokenId) external view returns (uint) {
        return _tokens[tokenId].auraPoints;
    }

    /**
     * @dev Returns the owner address and staked status among the token information with the given 'tokenId'.
     * 
     * AuraChefNFT's `stake` function calls it to get token's information by token ID
     */
    function getInfoForStaking(uint tokenId) external view returns (address tokenOwner, bool isStaked, uint auraPoints) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        tokenOwner = ownerOf[tokenId];
        isStaked = _tokens[tokenId].isStaked;
        auraPoints = _tokens[tokenId].auraPoints;
    }

    /**
     * @dev External function to get level by `tokenId`
     */
    function getLevel(uint tokenId) external view returns (uint) {
        return _tokens[tokenId].level;
    }

    /** 
     * @dev Set to set Base URI
     * @param tokenId uint ID of the token to be staked/unstaked
     * @param isStaked bool whether to being staked or not
     *
     * AuraChefNFT's `stake` function calls it to set staked status into token's info by token ID
     * 
     * NOTE: - Staked token can't be transferred to anyone
     *       - Staker would be AuraChefNFT contract
     */
    function setIsStaked(uint tokenId, bool isStaked) external onlyStaker {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        if (isStaked == true) {
            // Clear approval for not to transfer when staked token 
            getApproved[tokenId] = address(0);
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
     * @dev External function to set AuraPointsTable
     */
    function setAuraPointsTable(uint[7] calldata apTable) external onlyOwner {
        _auraPointsTable = apTable;
    }

    /**
     * @dev External function to set LevelTable
     */
    function setLevelTable(uint[7] calldata levelTable) external onlyOwner {
        _levelTable = levelTable;
    }

    /**
     * @dev External function to set LevelUpPercent
     *
     * NOTE: percentage value: e.g. 10%
     */
    function setLevelUpPercent(uint8 percent) external onlyOwner {
        require(percent > 0, "Wrong percent value");
        _levelUpPercent = percent;
    }

    /**
     * @dev Used by stake Admin function to accrue AuraPoints `amount` to `user`
     *
     * NOTE: It would be called by swap contract.
     *       An user can receive AuraPoints as a reward when Swapping
     */
    function accrueAuraPoints(address user, uint amount) external onlyStaker {
        // TODO:
    }

    //Internal functions --------------------------------------------------------------------------------------------

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return ownerOf[tokenId] != address(0);
    }

    //Role functions for Staker --------------------------------------------------------------------------------------

    /**
     * @dev used by owner to add staker who changes `isStaked` of token
     * @param _addStaker address of staker to be added.
     * @return true if successful.
     */
    function addStaker(address _addStaker) public onlyOwner returns (bool) {
        require(
            _addStaker != address(0),
            "AuraNFT: _addStaker is the zero address"
        );
        return EnumerableSet.add(_stakers, _addStaker);
    }

    /**
     * @dev used by owner to delete staker who changes `isStaked` of token
     * @param _delStaker address of staker to be deleted.
     * @return true if successful.
     */
    function delStaker(address _delStaker) external onlyOwner returns (bool) {
        require(
            _delStaker != address(0),
            "AuraNFT: _delStaker is the zero address"
        );
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
        require(_index <= getStakerLength() - 1, "AuraNFT: index out of bounds");
        return EnumerableSet.at(_stakers, _index);
    }

    /**
     * @dev Modifier for changing `isStaked` of token
     */
    modifier onlyStaker() {
        require(isStaker(msg.sender), "caller is not the staker");
        _;
    }

    //Role functions for Minter --------------------------------------------------------------------------------------

    /**
     * @dev used by owner to add minter who can mint
     * @param _addMinter address of minter to be added.
     * @return true if successful.
     */
    function addMinter(address _addMinter) public onlyOwner returns (bool) {
        require(
            _addMinter != address(0),
            "AuraNFT: _addMinter is the zero address"
        );
        return EnumerableSet.add(_minters, _addMinter);
    }

    /**
     * @dev used by owner to delete minter who changes `isStaked` of token
     * @param _delMinter address of minter to be deleted.
     * @return true if successful.
     */
    function delMinter(address _delMinter) external onlyOwner returns (bool) {
        require(
            _delMinter != address(0),
            "AuraNFT: _delMinter is the zero address"
        );
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
     * @dev Get the staker at n location
     * @param _index index of address set
     * @return address of staker at index.
     */
    function getMinter(uint256 _index)
        external
        view
        onlyOwner
        returns (address)
    {
        require(_index <= getMinterLength() - 1, "AuraNFT: index out of bounds");
        return EnumerableSet.at(_stakers, _index);
    }

    /**
     * @dev Modifier for changing `isStaked` of token
     */
    modifier onlyMinter() {
        require(isMinter(msg.sender), "caller is not the staker");
        _;
    }
}
