// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../libraries/Percent.sol";

contract FeeMinter is Ownable {
    /// Overall rate at which to mint new tokens
    uint256 public totalToMintPerBlock;

    /// Version of the toMintPercent mapping
    uint32 private _version;

    /// Map approved minter address to a percent of totalToMintPerBlock rate
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
        require(_minters.length == _toMintPercents.length, "FeeEmittor: array length mismatch");

        // Increment the version and delete the previous mapping
        _version++;

        // Maintain a running tally of percents to enforce that they sum to 100
        uint256 percentSum;

        for (uint256 i = 0; i < _minters.length; i++) {
            address minter = _minters[i];
            require(minter != address(0), "FeeMinter: zero address");

            uint256 toMintPercent = _toMintPercents[i];
            percentSum += toMintPercent;
            require(percentSum <= 100, "FeeMinter: percent sum exceeds 100");

            _toMintPercent[_key(minter)] = toMintPercent;
        }
        require(percentSum == 100, "FeeMinter: percents do not sum to 100");

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

    /// Return the toMintPercent for _minter
    function getToMintPercent(address _minter) public view returns (uint256) {
        return _toMintPercent[_key(_minter)];
    }

    // Return a key to the toMintPercent mapping based on _version and _minter
    function _key(address _minter) private view returns (bytes32) {
        return keccak256(abi.encodePacked(_version, _minter));
    }
}
