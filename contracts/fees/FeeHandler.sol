// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../libraries/Percent.sol";

import "../interfaces/IHelixChefNFT.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Handles routing received fees to internal contracts
contract FeeHandler is Initializable, OwnableUpgradeable {
    /// Owner defined fee recipient
    address public treasury;

    /// Owner defined pool where fees can be staked
    IHelixChefNFT public nftChef;

    /// Determines percentage of collector fees sent to nftChef
    uint256 public nftChefPercent;

    // Emitted when a new treasury address is set by the owner
    event SetTreasury(address _treasury);

    // Emitted when a new nftChef address is set by the owner
    event SetNftChef(address _nftChef);

    // Emitted when a new nftChef percent is set by the owner
    event SetNftChefPercent(uint256 _nftChefPercent);

    modifier onlyValidFee(uint256 _fee) {
        require(_fee > 0, "FeeHandler: zero fee");
        _;
    }

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "FeeHandler: zero address");
        _;
    }

    modifier onlyValidPercent(uint256 _percent) {
        require(Percent.isValidPercent(_percent), "FeeHandler: percent exceeds max");
        _;
    } 

    function initialize(address _treasury, address _nftChef) external initializer {
        __Ownable_init();
        treasury = _treasury;
        nftChef = IHelixChefNFT(_nftChef);
    }
    
    /// Called by a FeeCollector to send _amount of _token to this FeeHandler
    /// handles sending fees to treasury and staking with nftChef
    function transferFee(IERC20 _token, address _from, address _rewardAccruer, uint256 _fee) 
        external 
        onlyValidFee(_fee) 
    {
        (uint256 nftChefAmount, uint256 treasuryAmount) = _getSplit(_fee, nftChefPercent);

        if (nftChefAmount > 0) {
            _token.transferFrom(_from, address(nftChef), nftChefAmount);
            nftChef.accrueReward(_rewardAccruer, nftChefAmount);
        }

        if (treasuryAmount > 0) {
            _token.transferFrom(_from, treasury, treasuryAmount);
        }
    }

    /// Called by the owner to set a new _treasury address
    function setTreasury(address _treasury) external onlyOwner onlyValidAddress(_treasury) { 
        treasury = _treasury;
        emit SetTreasury(_treasury);
    }

    /// Called by the owner to set a new _nftChef address
    function setNftChef(address _nftChef) 
        external 
        onlyOwner 
        onlyValidAddress(_nftChef) 
    {
        nftChef = IHelixChefNFT(_nftChef);
        emit SetNftChef(_nftChef);
    }

    /// Called by the owner to set the _nftChefPercent taken from the total collector fees
    /// and staked with the nftChef
    function setNftChefPercent(uint256 _nftChefPercent) 
        external 
        onlyOwner 
        onlyValidPercent(_nftChefPercent) 
    {
        nftChefPercent = _nftChefPercent;
        emit SetNftChefPercent(_nftChefPercent);
    }

    /// Return the nftChef fee computed from the _amount and the nftChefPercent
    function getNftChefFee(uint256 _amount) external view returns (uint256 nftChefFee) {
        nftChefFee = _getFee(_amount, nftChefPercent);
    }

    /// Split _amount based on nftChefPercent and return the nftChefFee and the remainder
    /// where remainder == _amount - nftChefFee
    function getNftChefFeeSplit(uint256 _amount)
        external 
        view
        returns (uint256 nftChefFee, uint256 remainder)
    {
        (nftChefFee, remainder) = _getSplit(_amount, nftChefPercent);
    }

    /// Return the fee computed from the _amount and the _percent
    function _getFee(uint256 _amount, uint256 _percent) 
        private 
        pure 
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
}
