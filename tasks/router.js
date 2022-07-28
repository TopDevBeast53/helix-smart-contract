const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "HelixRouterV1"
const address = contracts.router[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// WETH
task("router.WETH")
    .setAction(async () => {
        const result = await (await contract()).WETH()
        console.log(result.toString())
    })

// _WETH

// _factory

// factory

// getAmountIn

// getAmountIn

// getAmountOut

// getAmountOut

// getAmountsIn

// getAmountsOut

// owner

// paused

// quote

// swapRewards


// WRITE



// addLiquidity

// addLiquidityETH

// pause

// removeLiquidity

// removeLiquidityETH

// removeLiquidityETHSupportingFeeOnTranferTokens

// removeLiquidityETHWithPermit

// removeLiquidityETHWithPermitSupportingFeeOnTransferTokens

// removeLiquidityWithPermit

// renounceOwnership

// setSwapRewards

// swapETHForExactTokens

// swapExactETHForTokens

// swapExactETHForTokensSupportingFeeOnTransferTokens

// swapExactTokensForETH

// swapExactTokensForETHSupportingFeeOnTransferTokens

// swapExactTokensForTokens

// swapExactTokensForTokensSupportingFeeOnTransferTokens

// swapTokensForExactETH

// swapTokensForExactTokens

// transferOwnership

// unpause
