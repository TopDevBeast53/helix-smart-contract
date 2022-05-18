// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../libraries/Percent.sol";

contract FeeCollectorUpgradeable is OwnableUpgradeable {
    /// Owner defined fee recipient
    address public treasury;

    /// Owner defined percent collected by the treasury on transactions
    uint256 public treasuryPercent;

    // Emitted when a new treasury address is set by the owner
    event SetTreasury(address _treasury);

    // Emitted when a new treasury percent is set by the owner
    event SetTreasuryPercent(uint256 _treasuryPercent);

    /// Return true if the treasury address is set and false otherwise
    function isTreasurySet() external view returns (bool) {
        return treasury != address(0);
    }

    /// Called by the owner to set a new _treasury address
    function setTreasury(address _treasury) external onlyOwner { 
        _requireValidAddress(_treasury);
        treasury = _treasury;
        emit SetTreasury(_treasury);
    }

    /// Called by the owner to set the _treasuryPercent percent collected by the treasury on transactions
    function setTreasuryPercent(uint256 _treasuryPercent) external onlyOwner {
        _requireValidTreasuryFee(_treasuryPercent);
        treasuryPercent = _treasuryPercent;
        emit SetTreasuryPercent(_treasuryPercent);
    }

    /// Return the treasury fee computed from the _amount and the treasuryPercent
    function getTreasuryFee(uint256 _amount) public view returns (uint256 treasuryFee) {
        treasuryFee = Percent.getPercentage(_amount, treasuryPercent);
    }

    /// Split _amount based on treasuryPercent and return the treasury fee and the remainder
    /// where remainder == _amount - treasuryFee
    function getTreasuryFeeSplit(uint256 _amount) public view returns (uint256 treasuryFee, uint256 remainder) {
        (treasuryFee, remainder) = Percent.splitByPercent(_amount, treasuryPercent);
    }

    function _requireValidAddress(address _address) private pure {
        require(_address != address(0), "FeeCollector: zero address");
    }

    function _requireValidTreasuryFee(uint256 _treasuryPercent) private pure {
        require(Percent.isValidPercent(_treasuryPercent), "FeeCollector: percent exceeds max");
    }
}
