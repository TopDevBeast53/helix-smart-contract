// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/Percent.sol";

contract FeeCollector is Ownable {
    /// Owner defined fee recipient
    address public treasury;

    /// Owner defined pool where fees can be staked
    address public nftChef;

    /// Determines the total percent taken by the collector
    uint256 public collectorPercent;

    /// Determines percentage of collector fees sent to nftChef
    uint256 public nftChefPercent;

    // Emitted when a new treasury address is set by the owner
    event SetTreasury(address _treasury);

    // Emitted when a new nftChef address is set by the owner
    event SetNftChef(address _nftChef);

    // Emitted when a new collector percent is set by the owner
    event SetCollectorPercent(uint256 _collectorPercent);

    // Emitted when a new nftChef percent is set by the owner
    event SetNftChefPercent(uint256 _nftChefPercent);

    /// Return true if the treasury address is set and false otherwise
    function isTreasurySet() external view returns (bool) {
        return treasury != address(0);
    }
    
    /// Return true if the nftChef address is set and false otherwise
    function isNftChefSet() external view returns (bool) {
        return nftChef != address(0);
    }

    /// Called by the owner to set a new _treasury address
    function setTreasury(address _treasury) external onlyOwner { 
        _requireValidAddress(_treasury);
        treasury = _treasury;
        emit SetTreasury(_treasury);
    }

    /// Called by the owner to set a new _nftChef address
    function setNftChef(address _nftChef) external onlyOwner {
        _requireValidAddress(_nftChef);
        nftChef = _nftChef;
        emit SetNftChef(_nftChef);
    }

    /// Called by the owner to set the _collectorPercent collected from transactions
    function setCollectorPercent(uint256 _collectorPercent) external onlyOwner {
        _requireValidPercent(_collectorPercent);
        collectorPercent = _collectorPercent;
        emit SetCollectorPercent(_collectorPercent);
    }

    /// Called by the owner to set the _nftChefPercent taken from the total collectorFee
    /// and staked with the nftChef
    function setNftChefPercent(uint256 _nftChefPercent) external onlyOwner {
        _requireValidPercent(_nftChefPercent);
        nftChefPercent = _nftChefPercent;
        emit SetNftChefPercent(_nftChefPercent);
    }

    /// Return the collector fee computed from the _amount and the collectorPercent
    function getCollectorFee(uint256 _amount) public view returns (uint256 collectorFee) {
        collectorFee = _getFee(_amount, collectorPercent);
    }

    /// Return the nftChef fee computed from the _amount and the nftChefPercent
    function getNftChefFee(uint256 _amount) public view returns (uint256 nftChefFee) {
        nftChefFee = _getFee(_amount, nftChefPercent);
    }

    /// Split _amount based on collectorPercent and return the collectorFee and the remainder
    /// where remainder == _amount - collectorFee
    function getCollectorFeeSplit(uint256 _amount) 
        public 
        view 
        returns (uint256 collectorFee, uint256 remainder) 
    {
        (collectorFee, remainder) = _getSplit(_amount, collectorPercent);
    }

    /// Split _amount based on nftChefPercent and return the nftChefFee and the remainder
    /// where remainder == _amount - nftChefFee
    function getNftChefFeeSplit(uint256 _amount)
        public
        view
        returns (uint256 nftChefFee, uint256 remainder)
    {
        (nftChefFee, remainder) = _getSplit(_amount, nftChefPercent);
    }

    /// Return the fee computed from the _amount and the _percent
    function _getFee(uint256 _amount, uint256 _percent) 
        public 
        view 
        returns (uint256 fee) 
    {
        fee = Percent.getPercentage(_amount, _percent);
    }

    /// Split _amount based on _percent and return the fee and the remainder
    /// where remainder == _amount - fee
    function _getSplit(uint256 _amount, uint256 _percent) 
        private 
        pure 
        returns (uint256 fee, uint256 remainder)
    {
        (fee, remainder) = Percent.splitByPercent(_amount, _percent);
    }

    // Require that the _address is valid
    function _requireValidAddress(address _address) private pure {
        require(_address != address(0), "FeeCollector: zero address");
    }

    // Require that the _percent is valid
    function _requireValidPercent(uint256 _percent) private pure {
        require(Percent.isValidPercent(_percent), "FeeCollector: percent exceeds max");
    }
}
