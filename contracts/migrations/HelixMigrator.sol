// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IHelixMigrator.sol";
import "../interfaces/IHelixV2Router02.sol";
import "../interfaces/IExternalRouter.sol";

contract HelixMigrator is Pausable, Ownable {
    IHelixV2Router02 public router;

    constructor(IHelixV2Router02 _router) {
        require(address(_router) != address(0), "Migrator: zero address");
        router = _router;
    }

    event MigrateLiquidity(
        address indexed sender,             // Migrate liquidity function caller
        address indexed externalRouter,     // External DEX's router
        uint256 exLiquidity,                // Liquidity in external DEX
        uint256 exBalanceTokenA,            // Token A balance in external DEX
        uint256 exBalanceTokenB,            // Token B balance in external DEX
        uint256 liquidity,                  // Liquidity moved to DEX
        uint256 balanceTokenA,              // Token A balance moved to DEX
        uint256 balanceTokenB               // Token B balance moved to DEX
    );

    /// Migrate _lpToken composed of _tokenA and _tokenB from _externalRouter to router
    function migrateLiquidity(
        address _tokenA, 
        address _tokenB, 
        address _lpToken, 
        address _externalRouter
    ) 
        external 
        whenNotPaused
        returns (bool) 
    {
        // Transfer the caller's external liquidity balance to this contract
        uint256 exLiquidity = IERC20(_lpToken).balanceOf(msg.sender);
        require(exLiquidity > 0, "Migrator: caller has no lp balance");
        require(
            IERC20(_lpToken).transferFrom(msg.sender, address(this), exLiquidity), 
            "Migrator: lp transfer from failed"
        );

        // Approve external router to spend up to exLiquidity amount of the liquidity
        require(
            IERC20(_lpToken).approve(_externalRouter, exLiquidity), 
            "Migrator: external lp approval failed"
        );

        // Remove the token balances from the external exchange
        (uint256 exBalanceTokenA, uint256 exBalanceTokenB) = IExternalRouter(_externalRouter).removeLiquidity(
            _tokenA,            // address of tokenA
            _tokenB,            // address of tokenB
            exLiquidity,        // amount of liquidity to remove
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            address(this),      // recipient of underlying assets
            block.timestamp     // deadline until tx revert
        );

        // Approve this router to spend up to the external token balances
        require(
            IERC20(_tokenA).approve(address(router), exBalanceTokenA), 
            "Migrator: token A router approval failed"
        );
        require(
            IERC20(_tokenB).approve(address(router), exBalanceTokenB), 
            "Migrator: token B router approval failed"
        );

        // Move the external token balances to this exchange
        // Note: addLiquidity handles adding token pair to factory
        (uint256 balanceTokenA, uint256 balanceTokenB, uint256 liquidity) = router.addLiquidity(
            _tokenA,            // address of token A
            _tokenB,            // address of token B
            exBalanceTokenA,    // desired amount of A
            exBalanceTokenB,    // desired amount of B
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            msg.sender,         // liquidity tokens recipient
            block.timestamp     // deadline until tx revert
        ); 

        // Log relevant migration details
        emit MigrateLiquidity(
            msg.sender,
            _externalRouter,
            exLiquidity,
            exBalanceTokenA,
            exBalanceTokenB,
            liquidity,
            balanceTokenA,
            balanceTokenB
        );

        return true;
    }

    /// Called by the owner to set the router address
    function setRouter(IHelixV2Router02 _router) external onlyOwner {
        require(address(_router) != address(0), "Migrator: zero address");
        router = _router;
    }

    /// Called by the owner to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// Called by the owner to unpause the contract
    function unpause() external onlyOwner {
        _unpause(); 
    }
}
