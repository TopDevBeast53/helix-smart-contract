// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/ISwapRewards.sol";
import "../interfaces/IOracleFactory.sol";
import "../interfaces/IHelixToken.sol";
import "../interfaces/IReferralRegister.sol";
import "../libraries/Percent.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// Thrown when address(0) is encountered
error ZeroAddress();

/// Thrown when the caller is not the router
error NotRouter(address caller, address router);

/// Distribute HELIX reward when users swap tokens
contract SwapRewards is ISwapRewards, Ownable, Pausable {
    /// The HELIX reward token
    IHelixToken public helixToken;

    /// Determines the amount of HELIX earned based the swap
    IOracleFactory public oracleFactory;

    /// Generate rewards for the user's referrer
    IReferralRegister public refReg;

    /// The router contract which can call the swap
    address public router;

    // Emitted when a swap is performed
    event Swap(
        address user,
        address indexed tokenIn, 
        uint256 amountIn,
        uint256 helixOut
    );

    // Emitted when the helixToken is set
    event SetHelixToken(address indexed setter, address indexed helixToken);

    // Emitted when the oracleFactory is set
    event SetOracleFactory(address indexed setter, address indexed oracleFactory);

    // Emitted when the refReg is set
    event SetRefReg(address indexed setter, address indexed refReg);

    // Emitted when the router is set
    event SetRouter(address indexed setter, address indexed router);

    modifier onlyValidAddress(address _address) {
        if (_address == address(0)) revert ZeroAddress();
        _;
    }

    constructor(
        address _helixToken,
        address _oracleFactory,
        address _refReg,
        address _router
    ) {
        helixToken = IHelixToken(_helixToken);
        oracleFactory = IOracleFactory(_oracleFactory);
        refReg = IReferralRegister(_refReg);
        router = _router;
    }

    /// Accrue HELIX proportional to _amountIn of _tokenIn to the _user performing a swap
    function swap(address _user, address _tokenIn, uint256 _amountIn) 
        external 
        whenNotPaused
    {
        if (msg.sender != router) revert NotRouter(msg.sender, router);
    
        uint256 helixOut = oracleFactory.consult(_tokenIn, _amountIn, address(helixToken));
        if (helixOut > 0) {
            refReg.rewardSwap(_user, helixOut);
        }
        
        emit Swap(_user, _tokenIn, _amountIn, helixOut);
    }

    /// Called by the owner to set the _helixToken
    function setHelixToken(address _helixToken) 
        external 
        onlyOwner 
        onlyValidAddress(_helixToken)
    {
        helixToken = IHelixToken(_helixToken);
        emit SetHelixToken(msg.sender, _helixToken);
    }

    /// Called by the owner to set the _oracleFactory
    function setOracleFactory(address _oracleFactory) 
        external 
        onlyOwner 
        onlyValidAddress(_oracleFactory) 
    {
        oracleFactory = IOracleFactory(_oracleFactory);
        emit SetOracleFactory(msg.sender, _oracleFactory);
    }

    /// Called by the owner to set the _refReg
    function setRefReg(address _refReg) 
        external 
        onlyOwner 
        onlyValidAddress(_refReg) 
    {
        refReg = IReferralRegister(_refReg);
        emit SetRefReg(msg.sender, _refReg);
    }

    /// Called by the owner to set the _router
    function setRouter(address _router) external onlyOwner onlyValidAddress(_router) {
        router = _router;
        emit SetRouter(msg.sender, _router);
    }

    /// Called by the owner to pause swaps
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause swaps
    function unpause() external onlyOwner {
        _unpause();
    }
}
