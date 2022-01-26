// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '@uniswap/lib/contracts/libraries/TransferHelper.sol';
import '../interfaces/IAuraMigrator.sol';
import '../interfaces/IAuraFactory.sol';
import '../interfaces/IAuraV2Router02.sol';
import '../interfaces/IAuraExchange.sol';

contract AuraMigrator is IAuraMigrator {
    IAuraFactory immutable factory;
    IAuraV2Router02 immutable router;

    /**
     * @dev Used in calling addLiquidityETH.
     */
    struct AddressPair {
        address token;
        address to;
    }

    /**
     * @dev Used in calling addLiquidityETH.
     */
    struct UintPair {
        uint amount;
        uint amountMin;
    }

    constructor(address _factory, address _router) {
        factory = IAuraFactory(_factory);
        router = IAuraV2Router02(_router);
    }

    /**
     * @dev Handle ETH acceptance from exchange or router.
     */
    receive() external payable {}

    /**
     * @dev Calls the router's function of the same name.
     *      Avoids 'Stack too deep' error by passing structs.
     */
    function addLiquidityETH(
        AddressPair memory addressPair, 
        UintPair memory tokenPair,
        UintPair memory ethPair,
        uint deadline
    ) 
        private 
        returns(uint ethAmount, uint tokenAmount)
    {
        (ethAmount, tokenAmount, ) = router.addLiquidityETH{value: ethPair.amount}(
            addressPair.token,
            tokenPair.amount,
            tokenPair.amountMin,
            ethPair.amountMin,
            addressPair.to,
            deadline
        );
    }

    /**
     * @dev Used to migrate `token`.
     */
    function migrate(address token, address to, uint tokenAmountMin, uint ethAmountMin, uint deadline) external override {
        IAuraExchange exchange = IAuraExchange(factory.getExchange(token));
        uint liquidity = exchange.liquidityOf(msg.sender);
        require(exchange.transferFrom(msg.sender, address(this), liquidity), 'Migrator: Transfer failed');

        (uint ethAmount1, uint tokenAmount1) = exchange.removeLiquidity(liquidity, 1, 1, type(uint).max);
        TransferHelper.safeApprove(token, address(router), tokenAmount1);

        AddressPair memory addressPair = AddressPair(token, to);
        UintPair memory tokenPair = UintPair(tokenAmount1, tokenAmountMin);
        UintPair memory ethPair = UintPair(ethAmount1, ethAmountMin);
        (uint ethAmount2, uint tokenAmount2) = addLiquidityETH(addressPair, tokenPair, ethPair, deadline);

        if (tokenAmount1 > tokenAmount2) {
            TransferHelper.safeApprove(token, address(router), 0);
            TransferHelper.safeTransfer(token, msg.sender, tokenAmount1 - tokenAmount2);
        } else if (ethAmount1 > ethAmount2) {
            TransferHelper.safeTransferETH(msg.sender, ethAmount1 - ethAmount2);
        }
    }
}
