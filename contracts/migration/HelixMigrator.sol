// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IHelixMigrator.sol";
import "../interfaces/IHelixV2Router02.sol";
import "../interfaces/IExternalRouter.sol";

contract HelixMigrator is IHelixMigrator, Ownable {
    IHelixV2Router02 public router;

    constructor(address _router) {
        setRouter(_router);
    }

    event MigrateLiquidity(
        address indexed sender,             // Migrate liquidity function caller
        address indexed externalRouter,     // External DEX"s router
        uint exLiquidity,                   // Liquidity in external DEX
        uint exBalanceTokenA,               // Token A balance in external DEX
        uint exBalanceTokenB,               // Token B balance in external DEX
        uint liquidity,                     // Liquidity moved to DEX
        uint balanceTokenA,                 // Token A balance moved to DEX
        uint balanceTokenB                  // Token B balance moved to DEX
    );

    /** 
     * @notice Migrate liquidity pair (tokenA, tokenB) from external DEX to this DEX.
     */
    function migrateLiquidity(address tokenA, address tokenB, address lpToken, address externalRouter) external returns(bool) {
        // Transfer the caller"s external liquidity balance to this contract.
        uint exLiquidity = IERC20(lpToken).balanceOf(msg.sender);
        require(exLiquidity > 0, "migrateLiquidity: caller has no lp balance");
        require(IERC20(lpToken).transferFrom(msg.sender, address(this), exLiquidity), "migrateLiquidity: lp transfer from failed");

        // Approve external router to spend up to `exLiquidity` amount of the liquidity.
        require(IERC20(lpToken).approve(externalRouter, exLiquidity), "migrateLiquidity: external lp approval failed");

        // Remove the token balances from the external exchange.
        (uint exBalanceTokenA, uint exBalanceTokenB) = IExternalRouter(externalRouter).removeLiquidity(
            tokenA,             // address of tokenA
            tokenB,             // address of tokenB
            exLiquidity,        // amount of liquidity to remove
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            address(this),      // recipient of underlying assets
            block.timestamp     // deadline until tx revert
        );

        // Approve this router to spend up to the external token balances.
        require(IERC20(tokenA).approve(address(router), exBalanceTokenA), "migrateLiquidity: token A router approval failed");
        require(IERC20(tokenB).approve(address(router), exBalanceTokenB), "migrateLiquidity: token B router approval failed");

        // Move the external token balances to this exchange.
        // Note: addLiquidity handles adding token pair to factory.
        (uint balanceTokenA, uint balanceTokenB, uint liquidity) = router.addLiquidity(
            tokenA,             // address of token A
            tokenB,             // address of token B
            exBalanceTokenA,    // desired amount of A
            exBalanceTokenB,    // desired amount of B
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            msg.sender,         // liquidity tokens recipient
            block.timestamp     // deadline until tx revert
        ); 

        // Log relevant migration details.
        emit MigrateLiquidity(
            msg.sender,
            externalRouter,
            exLiquidity,
            exBalanceTokenA,
            exBalanceTokenB,
            liquidity,
            balanceTokenA,
            balanceTokenB
        );

        return true;
    }

    /**
     * @notice Set the router address.
     */
    function setRouter(address _router) public onlyOwner {
        require(_router != address(0), "HelixMigrator: Router address is Zero");
        router = IHelixV2Router02(_router);
    }
}
