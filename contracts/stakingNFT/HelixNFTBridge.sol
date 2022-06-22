// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../tokens/HelixNFT.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// Thrown when the caller is not a bridger
error NotBridger(address caller);

/// Thrown when the token is already bridged
error AlreadyBridgedToken(string externalTokenID);

/// Thrown when bridgeFactoryId is already bridged
error AlreadyBridgedFactory(uint256 bridgeFactoryId);

/// Thrown when address(0) is encountered
error ZeroAddress();

/// Thrown when index is out of bounds
error IndexOutOfBounds(uint256 index, uint256 length);

/// Array length is 0
error NotArray();

/// Invalid array
error InvalidArray();

/// Invalid array
error NotOwner();

error AlreadyBridgedEthereumToken(uint256 tokenId);

/**
 * HelixNFTBridge is responsible for many things related to NFT Bridging from-/to-
 * Solana blockchain. Here's the full list:
 *  - allow Solana NFT to be minted on Ethereum (bridgeFromSolana)
 */
contract HelixNFTBridge is Ownable, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * Bridge status determines
     *  0: pendding status, so when the BridgeServer adds BridgedToken
     *  1: after minted the Ethereum NFT
     */
    enum BridgeStatus {
        Pendding,
        Bridged,
        Burned
    }

    struct BridgeFactory {
        address user;                   // owner of Ethereum NFT
        string[] externalIDs;           // wrapped tokenIDs of Solana
        string[] tokenURIs;             // wrapped tokenURIs of Solana : Ethereum NFT's TokenURI will be tokenURIs[0]
        BridgeStatus bridgeStatus;      // bridge status
    }

    /// bridgeFactoryId => BridgeFactory
    mapping(uint256 => BridgeFactory) public bridgeFactories;

    /// user -> bridgeFactoryIDs[]
    mapping(address => uint[]) public bridgeFactoryIDs;
    
    /// ethereum NFT tokenId -> true/false
    mapping(uint256 => bool) private _bridgedTokenIDs;
    
    /**
     * @dev If the NFT is available on the Ethereum, then this map stores true
     * for the externalID, false otherwise.
     */
    mapping(string => bool) private _bridgedExternalTokenIDs;

    /// for counting whenever add bridge once approve on solana 
    /// if it's down to 0, will call to remove bridger
    /// user => counts
    mapping(address => uint256) private _countAddBridge;
 
    uint256 public bridgeFactoryLastId;  
    /**
     * @dev Bridgers are Helix service accounts which listen to the events
     *      happening on the Solana chain and then enabling the NFT for
     *      minting / unlocking it for usage on Ethereum.
     */
    EnumerableSet.AddressSet private _bridgers;

    // Emitted when tokens are bridged to Ethereum
    event BridgeToEthereum(
        address indexed bridger,
        string[] indexed externalTokenIds,
        string uri
    );

    // Emitted when tokens are bridged to Solana
    event BridgeToSolana(
        string indexed externalRecipientAddr, 
        string[] externalTokenIDs
    );

    // Emitted when a bridger is added
    event AddBridger(address indexed bridger, string[] indexed externalIDs, uint256 newBridgeFactoryId);
    
    // Emitted when a bridger is deleted
    event DelBridger(address indexed bridger);
    
    /**
     * @dev HelixNFT contract    
     */
    HelixNFT helixNFT;

    constructor(HelixNFT _helixNFT) {
        helixNFT = _helixNFT;
    }
    
    function addBridgeFactory(address _user, string[] calldata _externalIDs, string[] calldata _tokenURIs)
      external 
      onlyOwner
    {
        if (_user == address(0)) revert ZeroAddress();
        if (_externalIDs.length == 0) revert NotArray();
        if (_externalIDs.length != _tokenURIs.length) revert InvalidArray();
        
        uint256 length = _externalIDs.length;
        for (uint256 i = 0; i < length; i++) {
            string memory _externalID = _externalIDs[i];
            if (_bridgedExternalTokenIDs[_externalID]) revert AlreadyBridgedToken(_externalID);
            _bridgedExternalTokenIDs[_externalID] = true;
        }
        string[] memory _newExternalIDs = new string[](length);
        string[] memory _newTokenURIs = new string[](length);
        _newExternalIDs = _externalIDs;
        _newTokenURIs = _tokenURIs;
        uint256 _bridgeFactoryId = bridgeFactoryLastId++;
        BridgeFactory storage _factory = bridgeFactories[_bridgeFactoryId];
        _factory.user = _user;
        _factory.bridgeStatus = BridgeStatus.Pendding;
        _factory.externalIDs = _newExternalIDs;
        _factory.tokenURIs = _newTokenURIs;

        // Relay the bridge id to the user's account
        bridgeFactoryIDs[_user].push(_bridgeFactoryId);

        _countAddBridge[_user]++;
        EnumerableSet.add(_bridgers, _user);
        emit AddBridger(_user, _externalIDs, _bridgeFactoryId);
    }
    /**
     * @dev This function is called ONLY by bridgers to bridge the token to Ethereum
     */
    function bridgeToEthereum(uint256 _bridgeFactoryId)
      external
      onlyBridger
      whenNotPaused
      returns(bool) 
    {
        address _user = msg.sender;
        if (_countAddBridge[_user] == 0) revert NotBridger(_user);
        BridgeFactory memory _bridgeFactory = bridgeFactories[_bridgeFactoryId];
        if (_bridgeFactory.user != _user) revert NotBridger(_user);
        if (_bridgeFactory.bridgeStatus != BridgeStatus.Pendding) revert AlreadyBridgedFactory(_bridgeFactoryId);

        _countAddBridge[_user]--;
        bridgeFactories[_bridgeFactoryId].bridgeStatus = BridgeStatus.Bridged;
        uint256 tokenId = helixNFT.getLastTokenId() + 1;
        _bridgedTokenIDs[tokenId] = true;
        // Ethereum NFT's TokenURI is first URI of wrapped geobots
        string memory tokenURI = _bridgeFactory.tokenURIs[0];
        helixNFT.mintExternal(_user, _bridgeFactory.externalIDs, tokenURI, _bridgeFactoryId);

        if (_countAddBridge[_user] == 0) 
            _delBridger(_user);

        emit BridgeToEthereum(_user, _bridgeFactory.externalIDs, tokenURI);
        return true;
    }

    function getBridgeFactoryIDs(address _user) external view returns (uint[] memory) {
        return bridgeFactoryIDs[_user];
    }

    function getBridgeFactories(address _user) external view returns (BridgeFactory[] memory) {
        uint256 length = bridgeFactoryIDs[_user].length;
        BridgeFactory[] memory _bridgeFactories = new BridgeFactory[](length);
        for (uint256 i = 0; i < length; i++) {
            _bridgeFactories[i] = bridgeFactories[bridgeFactoryIDs[_user][i]];
        }
        return _bridgeFactories;
    }

    /**
     * @dev Whether the token is bridged or not.
     */
    function isBridged(string calldata _externalTokenID) external view returns (bool) {
        return _bridgedExternalTokenIDs[_externalTokenID];
    }

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Mark token as unavailable on Ethereum.
     */
    function bridgeToSolana(uint256 _tokenId, string calldata _externalRecipientAddr) 
       external 
       whenNotPaused
    {
        if (helixNFT.ownerOf(_tokenId) != msg.sender) revert NotOwner();
        if (!_bridgedTokenIDs[_tokenId]) revert AlreadyBridgedEthereumToken(_tokenId);
        
        uint256 bridgeFactoryId = helixNFT.getBridgeFactoryId(_tokenId);
        BridgeFactory storage _bridgeFactory = bridgeFactories[bridgeFactoryId];
        if (_bridgeFactory.bridgeStatus != BridgeStatus.Bridged) revert AlreadyBridgedEthereumToken(_tokenId);

        string[] memory externalTokenIDs = _bridgeFactory.externalIDs;
        uint256 length = externalTokenIDs.length;
        for (uint256 i = 0; i < length; i++) {
            string memory externalID = externalTokenIDs[i];
            if (!_bridgedExternalTokenIDs[externalID]) revert AlreadyBridgedToken(externalID);
            _bridgedExternalTokenIDs[externalID] = false;
        }
        _bridgedTokenIDs[_tokenId] = false;
        _bridgeFactory.bridgeStatus = BridgeStatus.Burned;

        helixNFT.burn(_tokenId);
        emit BridgeToSolana(_externalRecipientAddr, externalTokenIDs);
    }

    /**
     * @dev used by owner to delete bridger
     * @param _bridger address of bridger to be deleted.
     * @return true if successful.
     */
    function delBridger(address _bridger) external onlyOwner returns (bool) {
        return _delBridger(_bridger);
    }

    function _delBridger(address _bridger) internal returns (bool) {
        if (_bridger == address(0)) revert ZeroAddress();
        emit DelBridger(_bridger);
        return EnumerableSet.remove(_bridgers, _bridger);
    }

    /**
     * @dev See the number of bridgers
     * @return number of bridges.
     */
    function getBridgersLength() public view returns (uint256) {
        return EnumerableSet.length(_bridgers);
    }

    /**
     * @dev Check if an address is a bridger
     * @return true or false based on bridger status.
     */
    function isBridger(address account) public view returns (bool) {
        return EnumerableSet.contains(_bridgers, account);
    }

    /**
     * @dev Get the staker at n location
     * @param _index index of address set
     * @return address of staker at index.
     */
    function getBridger(uint256 _index)
        external
        view
        onlyOwner
        returns (address)
    {
        uint256 length = getBridgersLength() - 1;
        if (_index > length) revert IndexOutOfBounds(_index, length);
        return EnumerableSet.at(_bridgers, _index);
    }

    /**
     * @dev Modifier for operations which can be performed only by bridgers
     */
    modifier onlyBridger() {
        if (!isBridger(msg.sender)) revert NotBridger(msg.sender);
        _;
    }
}
