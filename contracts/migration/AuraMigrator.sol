// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../interfaces/IAuraMigrator.sol';
import '../swaps/AuraFactory.sol';
import '../interfaces/IAuraV2Router02.sol';

contract AuraMigrator is IAuraMigrator, Ownable {
    AuraFactory public factory; 
    IAuraV2Router02 public router;

    modifier addressNotZero(address _address) {
        require(_address != address(0), 'AuraMigrator: Address is Zero');
        _;
    }

    constructor(address _factory, address _router) {
        setFactory(_factory);
        setRouter(_router);
    }

    /** 
     * @dev Migrate liquidity from external DEX to this DEX.
     */
    function migrateLiquidity(address tokenA, address tokenB, address lpToken, address externalRouter) external {
        // Transfer the caller's LP balance to this contract.
        uint amount = IERC20(lpToken).balanceOf(msg.sender);
        IERC20(lpToken).transferFrom(msg.sender, address(this), amount);

        uint prevBalanceTokenA = IERC20(tokenA).balanceOf(address(this));
        uint prevBalanceTokenB = IERC20(tokenB).balanceOf(address(this));

        // Approve removing amount of lpToken on caller's behalf. 
        IERC20(lpToken).approve(externalRouter, amount);

        // And remove the liquidity from the external router.
        IAuraV2Router02(externalRouter).removeLiquidity(
            tokenA,             // address of tokenA
            tokenB,             // address of tokenB
            amount,             // liquidity amount to remove
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            address(this),      // recipient of underlying assets
            block.timestamp     // deadline until tx revert
        );

        uint balanceTokenA = IERC20(tokenA).balanceOf(address(this)) - prevBalanceTokenA;
        uint balanceTokenB = IERC20(tokenB).balanceOf(address(this)) - prevBalanceTokenB;

        // Add this pair to the factory if it's not already there.
        address auraPair = factory.getPair(tokenA, tokenB);
        if (auraPair == address(0)) {
            factory.createPair(tokenA, tokenB);
        }

        // Approve adding tokens A and B on caller's behalf.
        IERC20(tokenA).approve(address(router), balanceTokenA);
        IERC20(tokenB).approve(address(router), balanceTokenB);

        // And add the tokens to aura router.
        router.addLiquidity(
            tokenA,             // address of token A
            tokenB,             // address of token B
            balanceTokenA,      // desired amount of A
            balanceTokenB,      // desired amount of B
            0,                  // minimum amount of A
            0,                  // minimum amount of B
            msg.sender,         // liquidity tokens recipient
            block.timestamp     // deadline until tx revert
        ); 
    }

    /**
     * @dev Changes the factory address.
     */
    function setFactory(address _factory) public onlyOwner addressNotZero(_factory) {
        factory = AuraFactory(_factory); 
    }

    /**
     * @dev Changes the router address.
     */
    function setRouter(address _router) public onlyOwner addressNotZero(_router) {
        router = IAuraV2Router02(_router);
    }
}
