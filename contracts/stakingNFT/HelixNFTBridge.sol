// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../tokens/HelixNFT.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// Thrown when the caller is not a bridger
error NotBridger(address caller);

/// Thrown when the token is already bridged
error AlreadyBridged(string externalId);

/// Thrown when address(0) is encountered
error ZeroAddress();

/// Thrown when index is out of bounds
error IndexOutOfBounds(uint256 index, uint256 length);

/**
 * HelixNFTBridge is responsible for many things related to NFT Bridging from-/to-
 * Solana blockchain. Here's the full list:
 *  - allow Solana NFT to be minted on Ethereum (bridgeFromSolana)
 */
contract HelixNFTBridge is Ownable, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @dev If the NFT is available on the Ethereum, then this map stores true
     * for the externalID, false otherwise.
     */
    mapping(string => bool) private _bridgedExternalTokenIDs;

    /**
     * @dev If the NFT is available on the Ethereum, but it either:
     * - has not been minted
     * - has not been picked up by the owner from the bridge contract
     */
    mapping(string => address) private _bridgedExternalTokenIDsPickUp;

    /// for counting whenever add bridge once approve on solana 
    /// if it's down to 0, will call to remove bridger
    /// user => counts
    mapping(address => uint256) private _countAddBridge;
    /**
     * @dev Bridgers are Helix service accounts which listen to the events
     *      happening on the Solana chain and then enabling the NFT for
     *      minting / unlocking it for usage on Ethereum.
     */
    EnumerableSet.AddressSet private _bridgers;

    // Emitted when tokens are bridged to Ethereum
    event BridgeToEthereum(
        address indexed bridger,
        address indexed owner,
        string[] indexed externalTokenIds,
        string uri
    );

    // Emitted when tokens are bridged to Solana
    event BridgeToSolana(
        string indexed externalRecipientAddr, 
        uint256 indexed tokenId,
        uint256 timestamp
    );

    // Emitted when a bridger is added
    event AddBridger(address indexed bridger, string externalTokenID);
    
    // Emitted when a bridger is deleted
    event DelBridger(address indexed bridger);
    
    /**
     * @dev HelixNFT contract    
     */
    HelixNFT helixNFT;

    constructor(HelixNFT _helixNFT) {
        helixNFT = _helixNFT;
    }
    
    /**
     * @dev This function is called ONLY by bridgers to bridge the token to Ethereum
     */
    function bridgeToEthereum(string[] calldata _externalTokenIDs, address _owner, string calldata _uri)
      onlyBridger
      external
      whenNotPaused
      returns(bool) 
    {
        if (_countAddBridge[_owner] == 0) revert NotBridger(_owner);
        uint256 length = _externalTokenIDs.length;
        for (uint256 i = 0; i < length; i++) {
            string memory externalID = _externalTokenIDs[i];
            if (_bridgedExternalTokenIDs[externalID]) revert AlreadyBridged(externalID);
            _bridgedExternalTokenIDs[externalID] = true;
            _bridgedExternalTokenIDsPickUp[externalID] = _owner;
        }
        
        _countAddBridge[_owner]--;

        helixNFT.mintExternal(_owner, _externalTokenIDs, _uri);
        // If the token is already minted, we could send it directly to the user's wallet
        if (_countAddBridge[_owner] == 0) 
            return _delBridger(_owner);

        emit BridgeToEthereum(msg.sender, _owner, _externalTokenIDs, _uri);
        return true;
    }

    /**
     * @dev Whether the token is bridged or not.
     */
    function isBridged(string calldata _externalTokenID) external view returns (bool) {
        return _bridgedExternalTokenIDs[_externalTokenID];
    }

    /**
     * @dev Get the owner to pick up the NFT from the bridge contract.
     */
    function getPickUpOwner(string calldata _externalTokenID) external view returns (address) {
        return _bridgedExternalTokenIDsPickUp[_externalTokenID];
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
        string[] memory externalTokenIDs = helixNFT.getExternalTokenIDs(_tokenId);
        uint256 length = externalTokenIDs.length;
        for (uint256 i = 0; i < length; i++) {
            string memory externalID = externalTokenIDs[i];
            if (!_bridgedExternalTokenIDs[externalID]) revert AlreadyBridged(externalID);
            if (_bridgedExternalTokenIDsPickUp[externalID] != msg.sender) revert NotBridger(msg.sender);

            // Mark as unavailable on Ethereum.
            _bridgedExternalTokenIDs[externalID] = false;
            _bridgedExternalTokenIDsPickUp[externalID] = address(0);
        }
        helixNFT.burn(_tokenId);

        emit BridgeToSolana(_externalRecipientAddr, _tokenId, block.timestamp);
    }

    /**
     * @dev used by owner to add a bridger service account who calls `bridgeFromSolana`
     * @param _bridger address of bridger to be added.
     * @return true if successful.
     */
    function addBridger(address _bridger, string calldata _externalTokenID) external onlyOwner returns (bool) {
        if (_bridger == address(0)) revert ZeroAddress();
        _countAddBridge[_bridger]++;
        emit AddBridger(_bridger, _externalTokenID);
        return EnumerableSet.add(_bridgers, _bridger);
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
