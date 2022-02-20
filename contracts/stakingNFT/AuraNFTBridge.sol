// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../tokens/AuraNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * AuraNFTBridge is responsible for many things related to NFT Bridging from-/to-
 * Solana blockchain. Here's the full list:
 *  - allow Solana NFT to be minted on BSC (bridgeFromSolana)
 */
contract AuraNFTBridge is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @dev If the NFT is available on the BSC, then this map stores true
     * for the externalID, false otherwise.
     */
    mapping(string => bool) private _bridgedExternalTokenIDs;

    /**
     * @dev If the NFT is available on the BSC, but it either:
     * - has not been minted
     * - has not been picked up by the owner from the bridge contract
     */
    mapping(string => address) private _bridgedExternalTokenIDsPickUp;

    mapping(string => string) private _externalIDToURI;

    /**
     * @dev Stores the mapping between external token IDs and addresses of the actual
     * minted AuraNFTs.
     */
     mapping(string => uint256) private _minted;

    /**
     * @dev Bridgers are Aura service accounts which listen to the events
     *      happening on the Solana chain and then enabling the NFT for
     *      minting / unlocking it for usage on BSC.
     */
    EnumerableSet.AddressSet private _bridgers;

    /**
     * @dev Struct to keep track of all the NFTs to be bridged to Solana.    
     */
    struct BridgeToSolana {
        string externalTokenID;
        string externalOwnerID;
        uint256 timestamp;
    }
    BridgeToSolana[] private _bridgeEvents;

    /**
     * @dev AuraNFT contract    
     */
    AuraNFT auraNFT;

    constructor(AuraNFT _auraNFT) {
        auraNFT = _auraNFT;
    }
    
    /**
     * @dev This function is called ONLY by bridgers to bridge the token to BSC
     */
    function bridgeFromSolana(string calldata externalTokenID, address owner, string calldata uri) onlyBridger external {
        require(!_bridgedExternalTokenIDs[externalTokenID], "AuraNFTBridge: The token is already bridged");
        _bridgedExternalTokenIDs[externalTokenID] = true;
        _bridgedExternalTokenIDsPickUp[externalTokenID] = owner;

        // If the token is already minted, we could send it directly to the user's wallet
        if (_minted[externalTokenID] > 0) {
            auraNFT.transferFrom(address(this), owner, _minted[externalTokenID]);
        } else {
            _externalIDToURI[externalTokenID] = uri;
        }
    }

    /**
     * @dev Used for minting the NFT first-time bridged to BSC from Solana.
     */
    function mintBridgedNFT(string calldata externalTokenID) external {
        require(_bridgedExternalTokenIDs[externalTokenID], "AuraNFTBridge: not available");
        require(_bridgedExternalTokenIDsPickUp[externalTokenID] == msg.sender, "AuraNFTBridge: pick up not allowed");

        auraNFT.mintExternal(msg.sender, externalTokenID, _externalIDToURI[externalTokenID]);

        _minted[externalTokenID] = auraNFT.getLastTokenId();
    }

    /**
     * @dev Whether the token is bridged or not.
     */
    function isBridged(string calldata externalTokenID) view public returns (bool) {
        return _bridgedExternalTokenIDs[externalTokenID];
    }

    /**
     * @dev Get the owner to pick up the NFT from the bridge contract.
     */
    function getPickUpOwner(string calldata externalTokenID) view public returns (address) {
        return _bridgedExternalTokenIDsPickUp[externalTokenID];
    }

    /**
     * @dev Returns the address of the minted NFT if available, address(0) otherwise.
     */
    function getMinted(string calldata externalTokenID) view public returns (uint256) {
        return _minted[externalTokenID];
    }

    /**
     * @dev Mark token as unavailable on BSC.
     */
    function bridgeToSolana(uint256 tokenId, string calldata externalOwnerAddress) external {
        // Get externalTokenID
        string memory externalTokenID = auraNFT.getExternalTokenID(tokenId);

        // Mark as unavailable on BSC.
        _bridgedExternalTokenIDs[externalTokenID] = false;
        _bridgedExternalTokenIDsPickUp[externalTokenID] = address(0);

        auraNFT.transferFrom(msg.sender, address(this), tokenId);

        _bridgeEvents.push(BridgeToSolana({
            externalTokenID: externalTokenID,
            externalOwnerID: externalOwnerAddress,
            timestamp: block.timestamp
        }));
    }

    /**
     * @dev used by owner to add a bridger service account who calls `bridgeFromSolana`
     * @param _bridger address of bridger to be added.
     * @return true if successful.
     */
    function addBridger(address _bridger) public onlyOwner returns (bool) {
        require(
            _bridger != address(0),
            "AuraNFTBridge: _bridger is the zero address"
        );
        return EnumerableSet.add(_bridgers, _bridger);
    }

    /**
     * @dev used by owner to delete bridger
     * @param _bridger address of bridger to be deleted.
     * @return true if successful.
     */
    function delBridger(address _bridger) external onlyOwner returns (bool) {
        require(
            _bridger != address(0),
            "AuraNFTBridge: _bridger is the zero address"
        );
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
        require(_index <= getBridgersLength() - 1, "AuraNFTBridge: index out of bounds");
        return EnumerableSet.at(_bridgers, _index);
    }

    /**
     * @dev Modifier for operations which can be performed only by bridgers
     */
    modifier onlyBridger() {
        require(isBridger(msg.sender), "caller is not the bridger");
        _;
    }

    /**
     * @dev Returns the number of bridge to solana events    
     */
    function getBridgeToSolanaEventsSize() view public returns (uint) {
        return _bridgeEvents.length;
    }

    /**
     * @dev Returns bridge to solana events.
     */
    function getBridgeToSolanaEvents() view public returns (BridgeToSolana[] memory) {
        return _bridgeEvents;
    }

    /**
     * @dev Returns a particular bridge to solana event.    
     */
    function getBridgeToSolanaEvent(uint index) view public returns (BridgeToSolana memory) {
        require(index < getBridgeToSolanaEventsSize(), "index out of bounds");
        return _bridgeEvents[index];
    }
}