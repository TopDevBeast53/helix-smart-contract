// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../interfaces/IAuraMigrator.sol';
import '../interfaces/IAuraV2Router02.sol';

contract AuraMigrator is IAuraMigrator, Ownable {
    constructor(address _router) {
        setRouter(_router);
    }

    /** 
     * @dev Migrate liquidity pair (tokenA, tokeB) from external DEX to this DEX.
     */
    function migrateLiquidity(address tokenA, address tokenB, address lpToken, address externalRouter) external {
        // Transfer the caller's liquidity balance to this contract.
        uint liquidity = IERC20(lpToken).balanceOf(msg.sender);
        IERC20(lpToken).transferFrom(msg.sender, address(this), liquidity);

        // Approve external router to spend up to `liquidity` amount of the liquidity.
        IERC20(lpToken).approve(externalRouter, liquidity);

        // Remove the token balances from the external exchange.
        (uint exBalanceTokenA, uint exBalanceTokenB) = IAuraV2Router02(externalRouter).removeLiquidity(
            tokenA,             // address of tokenA
            tokenB,             // address of tokenB
            liquidity,          // amount of liquidity to remove
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            address(this),      // recipient of underlying assets
            block.timestamp     // deadline until tx revert
        );

        // Approve this router to spend up to the external token balances.
        IERC20(tokenA).approve(address(router), exBalanceTokenA);
        IERC20(tokenB).approve(address(router), exBalanceTokenB);

        // Add the external token balances to this exchange.
        // Note: addLiquidity handles adding token pair to factory.
        (uint balanceTokenA, uint balanceTokenB, uint liquidity) = router.addLiquidity(
            tokenA,             // address of token A
            tokenB,             // address of token B
            balanceTokenA,      // desired amount of A
            balanceTokenB,      // desired amount of B
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            msg.sender,         // liquidity tokens recipient
            block.timestamp     // deadline until tx revert
        ); 

        // Return any dust to the caller.
        if (exBalanceTokenA > balanceTokenA) {
            uint dustTokenA = exBalanceTokenA - balanceTokenA;
            IERC20(tokenA).transfer(msg.sender, dustTokenA);
        }
        if (exBalanceTokenB > balanceTokenB) {
            uint dustTokenB = exBalanceTokenB - balanceTokenB;
            IERC20(tokenB).transfer(msg.sender, dustTokenB);
        }
        if (liquidity > 0) {
            IERC20(liquidity).transfer(msg.sender, liquidity);
        }
    }

    /**
     * @dev Sets the router address.
     */
    function setRouter(address _router) public onlyOwner addressNotZero(_router) {
        require(_address != address(0), 'AuraMigrator: Router address is Zero');
        router = IAuraV2Router02(_router);
    }
}
