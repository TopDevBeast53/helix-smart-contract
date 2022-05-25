// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../tokens/HelixNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * HelixNFTBridge is responsible for many things related to NFT Bridging from-/to-
 * Solana blockchain. Here's the full list:
 *  - allow Solana NFT to be minted on Ethereum (bridgeFromSolana)
 */
contract HelixNFTBridge is Ownable {
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

    event BridgeToSolana(string externalRecipientAddr, uint256 timestamp);
    event AddBridger(address indexed user, string externalTokenID);
    
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
    function bridgeToEthereum(string[] calldata externalTokenIDs, address owner, string calldata uri) onlyBridger external returns(bool) {
        require(_countAddBridge[owner] > 0, "HelixNFTBridge: You are not a Bridger");
        for (uint256 i = 0; i < externalTokenIDs.length; i++) {
            string memory externalID = externalTokenIDs[i];
            require(!_bridgedExternalTokenIDs[externalID], "HelixNFTBridge: The token is already bridged to Ethereum");
        }
        for (uint256 i = 0; i < externalTokenIDs.length; i++) {
            string memory externalID = externalTokenIDs[i];
            _bridgedExternalTokenIDs[externalID] = true;
            _bridgedExternalTokenIDsPickUp[externalID] = owner;
        }
        _countAddBridge[owner]--;

        helixNFT.mintExternal(owner, externalTokenIDs, uri);
        // If the token is already minted, we could send it directly to the user's wallet
        if (_countAddBridge[owner] == 0) 
            return _delBridger(owner);
        return true;
    }

    /**
     * @dev Whether the token is bridged or not.
     */
    function isBridged(string calldata externalTokenID) view external returns (bool) {
        return _bridgedExternalTokenIDs[externalTokenID];
    }

    /**
     * @dev Get the owner to pick up the NFT from the bridge contract.
     */
    function getPickUpOwner(string calldata externalTokenID) view external returns (address) {
        return _bridgedExternalTokenIDsPickUp[externalTokenID];
    }

    /**
     * @dev Mark token as unavailable on Ethereum.
     */
    function bridgeToSolana(uint256 tokenId, string calldata externalRecipientAddr) external {
        string[] memory externalTokenIDs = helixNFT.getExternalTokenIDs(tokenId);
        for (uint256 i = 0; i < externalTokenIDs.length; i++) {
            string memory externalID = externalTokenIDs[i];
            require(_bridgedExternalTokenIDs[externalID], "HelixNFTBridge: already bridged to Solana");
            require(_bridgedExternalTokenIDsPickUp[externalID] == msg.sender, "HelixNFTBridge: Not owner");
            // Mark as unavailable on Ethereum.
            _bridgedExternalTokenIDs[externalID] = false;
            _bridgedExternalTokenIDsPickUp[externalID] = address(0);
        }
        helixNFT.burn(tokenId);
        emit BridgeToSolana(externalRecipientAddr, block.timestamp);
    }

    /**
     * @dev used by owner to add a bridger service account who calls `bridgeFromSolana`
     * @param _bridger address of bridger to be added.
     * @return true if successful.
     */
    function addBridger(address _bridger, string calldata externalTokenID) external onlyOwner returns (bool) {
        require(
            _bridger != address(0),
            "HelixNFTBridge: _bridger is the zero address"
        );
        _countAddBridge[_bridger]++;
        emit AddBridger(_bridger, externalTokenID);
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
        require(
            _bridger != address(0),
            "HelixNFTBridge: _bridger is the zero address"
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
        require(_index <= getBridgersLength() - 1, "HelixNFTBridge: index out of bounds");
        return EnumerableSet.at(_bridgers, _index);
    }

    /**
     * @dev Modifier for operations which can be performed only by bridgers
     */
    modifier onlyBridger() {
        require(isBridger(msg.sender), "caller is not the bridger");
        _;
    }
}
