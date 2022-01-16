// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title Convenience contract for working with whitelisted addresses.
 */
contract AddressWhitelist is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private _whitelist;

    /**
     * @dev Add `_addr` to the whitelist.
     */
    function add(address _addr) external onlyOwner returns(bool) {
        require(_addr != address(0), "Zero address is invalid.");
        return EnumerableSet.add(_whitelist, _addr);
    }
  
    /**
     * @dev Remove `_addr` from the whitelist.
     */
    function remove(address _addr) external onlyOwner returns(bool) {
        require(_addr != address(0), "Zero address is invalid.");
        return EnumerableSet.remove(_whitelist, _addr);
    }
   
    /**
     * @return true if the whitelist contains `_addr` and false otherwise.
     */
    function contains(address _addr) external view returns(bool) {
        return EnumerableSet.contains(_whitelist, _addr);
    }

    /**
     * @return the number of whitelisted addresses.
     */
    function getLength() public view returns(uint256) {
        return EnumerableSet.length(_whitelist);
    }

    /**
     * @return the whitelisted address as `_index`.
     */
    function get(uint _index) external view returns(address) {
        require(_index <= getLength() - 1, "Index out of bounds.");
        return EnumerableSet.at(_whitelist, _index);
    }
}
