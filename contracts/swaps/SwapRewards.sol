// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../interfaces/ISwapRewards.sol";
import "../interfaces/IOracleFactory.sol";
import "../interfaces/IHelixToken.sol";
import "../interfaces/IReferralRegister.sol";
import "../libraries/Percent.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

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

    /// Percent earned on swaps in HELIX
    uint256 public rewardPercent;

    // Emitted when a swap is performed
    event Swap(
        address user,
        address indexed tokenIn, 
        uint256 amountIn,
        uint256 helixOut
    );

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "SwapFee: zero address");
        _;
    }

    constructor(
        IHelixToken _helixToken,
        IOracleFactory _oracleFactory,
        IReferralRegister _refReg,
        address _router, 
        uint256 _rewardPercent
    ) {
        helixToken = _helixToken;
        oracleFactory = _oracleFactory;
        refReg = _refReg;
        router = _router;
        rewardPercent = _rewardPercent;
    }

    /// Accrue HELIX proportional to _amountIn of _tokenIn to the _user performing a swap
    function swap(address _user, address _tokenIn, uint256 _amountIn) 
        external 
        whenNotPaused
    {
        require(msg.sender == router, "SwapFee: not router");

        uint256 helixOut = oracleFactory.consult(_tokenIn, _amountIn, address(helixToken));
        helixOut = Percent.getPercentage(helixOut, rewardPercent);

        if (helixOut > 0) {
            helixToken.mint(_user, helixOut);

            // Accrue HELIX to the swap caller referrer
            refReg.recordSwapReward(_user, helixOut);
        }
        
        emit Swap(_user, _tokenIn, _amountIn, helixOut);
    }

    /// Called by the owner to set the _helixToken
    function setHelixToken(IHelixToken _helixToken) 
        external 
        onlyOwner 
        onlyValidAddress(address(_helixToken)) 
    {
        helixToken = _helixToken;
    }

    /// Called by the owner to set the _oracleFactory
    function setOracleFactory(IOracleFactory _oracleFactory) 
        external 
        onlyOwner 
        onlyValidAddress(address(_oracleFactory)) 
    {
        oracleFactory = _oracleFactory;
    }

    /// Called by the owner to set the _refReg
    function setRefReg(IReferralRegister _refReg) 
        external 
        onlyOwner 
        onlyValidAddress(address(_refReg)) 
    {
        refReg = _refReg;
    }

    /// Called by the owner to set the _router
    function setRouter(address _router) external onlyOwner onlyValidAddress(_router) {
        router = _router;
    }

    /// Called by the owner to set the _rewardPercent
    function setRewardPercent(uint256 _rewardPercent) external onlyOwner {
        require(Percent.isValidPercent(_rewardPercent), "SwapFee: invalid percent");
        rewardPercent = _rewardPercent;
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
