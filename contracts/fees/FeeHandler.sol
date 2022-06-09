// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../libraries/Percent.sol";

import "../interfaces/IHelixChefNFT.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/// Thrown when attempting to assign an invalid fee
error InvalidFee(uint256 invalidFee);

/// Thrown when attempting to assign an invalid address
error InvalidAddress(address invalidAddress);

/// Handles routing received fees to internal contracts
contract FeeHandler is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// Owner defined fee recipient
    address public treasury;

    /// Owner defined pool where fees can be staked
    IHelixChefNFT public nftChef;

    /// Determines percentage of collector fees sent to nftChef
    uint256 public nftChefPercent;

    // Emitted when a new treasury address is set by the owner
    event SetTreasury(address indexed setter, address _treasury);

    // Emitted when a new nftChef address is set by the owner
    event SetNftChef(address indexed setter, address _nftChef);

    // Emitted when a new nftChef percent is set by the owner
    event SetNftChefPercent(address indexed setter, uint256 _nftChefPercent);

    // Emitted when fees are transferred by the handler
    event TransferFee(
        address indexed token,
        address indexed from,
        address indexed rewardAccruer,
        address nftChef,
        address treasury,
        uint256 fee,
        uint256 nftChefAmount,
        uint256 treasuryAmount
    );

    modifier onlyValidFee(uint256 _fee) {
        if (_fee == 0) revert InvalidFee(_fee);
        _;
    }

    modifier onlyValidAddress(address _address) {
        if (_address == address(0)) revert InvalidAddress(_address);
        _;
    }

    modifier onlyValidPercent(uint256 _percent) {
        if (!Percent.isValidPercent(_percent)) revert InvalidPercent(_percent, 0);
        _;
    } 

    function initialize(address _treasury, address _nftChef) external initializer {
        __Ownable_init();
        treasury = _treasury;
        nftChef = IHelixChefNFT(_nftChef);
    }
    
    /// Called by a FeeCollector to send _amount of _token to this FeeHandler
    /// handles sending fees to treasury and staking with nftChef
    function transferFee(
        IERC20Upgradeable _token, 
        address _from, 
        address _rewardAccruer, 
        uint256 _fee
    ) 
        external 
        onlyValidFee(_fee) 
    {
        (uint256 nftChefAmount, uint256 treasuryAmount) = _getSplit(_fee, nftChefPercent);

        if (nftChefAmount > 0) {
            _token.safeTransferFrom(_from, address(nftChef), nftChefAmount);
            nftChef.accrueReward(_rewardAccruer, nftChefAmount);
        }

        if (treasuryAmount > 0) {
            _token.safeTransferFrom(_from, treasury, treasuryAmount);
        }

        emit TransferFee(
            address(_token),
            _from,
            _rewardAccruer,
            address(nftChef),
            treasury,
            _fee,
            nftChefAmount,
            treasuryAmount
        );
    }

    /// Called by the owner to set a new _treasury address
    function setTreasury(address _treasury) external onlyOwner onlyValidAddress(_treasury) { 
        treasury = _treasury;
        emit SetTreasury(msg.sender, _treasury);
    }

    /// Called by the owner to set a new _nftChef address
    function setNftChef(address _nftChef) 
        external 
        onlyOwner 
        onlyValidAddress(_nftChef) 
    {
        nftChef = IHelixChefNFT(_nftChef);
        emit SetNftChef(msg.sender, _nftChef);
    }

    /// Called by the owner to set the _nftChefPercent taken from the total collector fees
    /// and staked with the nftChef
    function setNftChefPercent(uint256 _nftChefPercent) 
        external 
        onlyOwner 
        onlyValidPercent(_nftChefPercent) 
    {
        nftChefPercent = _nftChefPercent;
        emit SetNftChefPercent(msg.sender, _nftChefPercent);
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
