// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AuraNFT is ERC721, ReentrancyGuard {
    using Strings for uint256;

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    string private _internalBaseURI;


    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor (
        string memory baseURI
    ) ERC721(/*name=*/'Aura NFT', /*symbol=*/'AURA-NFT') {
        
        _internalBaseURI = baseURI;
    }
    
    //Public functions --------------------------------------------------------------------------------------------

    /**
     * @dev See {ERC721-tokenURI}.
     */
    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_exists(id), "ERC721Metadata: URI query for nonexistent token");

        return bytes(_internalBaseURI).length > 0 ? string(abi.encodePacked(_internalBaseURI, id.toString())) : "";
    }

    function mint(address to, uint256 tokenId) public nonReentrant {
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

    /** TODO only Owner accessable
     * @dev External function to set Base URI
     * @param newBaseUri address representing the new owner of the given token ID
     */
    function setBaseURI(string calldata newBaseUri) external {
        _internalBaseURI = newBaseUri;
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
}