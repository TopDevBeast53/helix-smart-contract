// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../libraries/Percent.sol";

/// Thrown when a should equal b but doesn't
error NotEqual(uint256 a, uint256 b);

/// Thrown when attempting to assign an invalid address
error InvalidAddress(address invalidAddress);

/// Thrown when a should be less than or equal to b but isn't
error NotLessThanOrEqualTo(uint256 a, uint256 b);

contract FeeMinter is Ownable {
    /// Overall rate at which to mint new tokens
    uint256 public totalToMintPerBlock;

    /// Owner approved minters with assigned toMintPercents
    address[] public minters;

    // Version of the toMintPercent mapping
    uint32 private _version;

    // Map approved minter address to a percent of totalToMintPerBlock rate
    mapping(bytes32 => uint256) private _toMintPercent;

    // Emitted when a new totalToMintPerBlock is set
    event SetTotalToMintPerBlock(address indexed setter, uint256 indexed totalToMintPerBlock);

    // Emitted when new minters are assigned toMintPercents
    event SetToMintPercents(
        address indexed setter,
        address[] indexed minters,
        uint256[] indexed toMintPercents,
        uint32 version
    );

    constructor(uint256 _totalToMintPerBlock) {
        totalToMintPerBlock = _totalToMintPerBlock;
    }

    /// Set the _totalToMintPerBlock rate
    function setTotalToMintPerBlock(uint256 _totalToMintPerBlock) external onlyOwner {
        totalToMintPerBlock = _totalToMintPerBlock;
        emit SetTotalToMintPerBlock(msg.sender, _totalToMintPerBlock);
    }

    /// Set the toMintPercent for each minter in _minters
    function setToMintPercents(address[] calldata _minters, uint256[] calldata _toMintPercents) 
        external 
        onlyOwner 
    { 
        if (_minters.length != _toMintPercents.length) {
            revert NotEqual(_minters.length, _toMintPercents.length);
        }

        // Increment the version and delete the previous mapping
        _version++;

        // Maintain a running tally of percents to enforce that they sum to 100
        uint256 percentSum;

        for (uint256 i = 0; i < _minters.length; i++) {
            address minter = _minters[i];
            if (minter == address(0)) revert InvalidAddress(minter);

            uint256 toMintPercent = _toMintPercents[i];
            percentSum += toMintPercent;
            if (percentSum > 100) revert NotLessThanOrEqualTo(percentSum, 100);

            _toMintPercent[_key(minter)] = toMintPercent;
        }
        if (percentSum != 100) revert NotEqual(percentSum, 100);

        minters = _minters;

        emit SetToMintPercents(
            msg.sender,
            _minters,
            _toMintPercents,
            _version
        );
    }
    
    /// Return the toMintBlock rate for _minter
    function getToMintPerBlock(address _minter) external view returns (uint256) {
        uint256 toMintPercent = getToMintPercent(_minter);
        return Percent.getPercentage(totalToMintPerBlock, toMintPercent);
    }

    /// Return the array of approved minter addresses
    function getMinters() external view returns (address[] memory) {
        return minters;
    }

    /// Return the toMintPercent for _minter
    function getToMintPercent(address _minter) public view returns (uint256) {
        return _toMintPercent[_key(_minter)];
    }

    // Return a key to the toMintPercent mapping based on _version and _minter
    function _key(address _minter) private view returns (bytes32) {
        return keccak256(abi.encodePacked(_version, _minter));
    }
}
