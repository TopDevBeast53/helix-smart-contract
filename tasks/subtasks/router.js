const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixRouterV1"
const address = contracts.router[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("router.WETH")
    .setAction(async () => {
        const result = await (await contract()).WETH()
        console.log(result.toString())
    })

subtask("router._WETH")
    .setAction(async () => {
        const result = await (await contract())._WETH()
        console.log(result.toString())
    })

subtask("router._factory")
    .setAction(async () => {
        const result = await (await contract())._factory()
        console.log(result.toString())
    })

subtask("router.factory")
    .setAction(async () => {
        const result = await (await contract()).factory()
        console.log(result.toString())
    })

subtask("router.getAmountIn")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).getAmountIn(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3
        )
        console.log(result.toString())
    })

/*
subtask("router.getAmountIn")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).getAmountIn(
            args.arg0,
            args.arg1,
            args.arg2,
        )
        console.log(result.toString())
    })
*/

/*
subtask("router.getAmountOut")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).getAmountOut(
            args.arg0,
            args.arg1,
            args.arg2,
        )
        console.log(result.toString())
    })
*/

subtask("router.getAmountOut")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).getAmountOut(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3
        )
        console.log(result.toString())
    })

subtask("router.getAmountsIn")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getAmountsIn(
            args.arg0,
            args.arg1
        )
        console.log(result.toString())
    })

subtask("router.getAmountsOut")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getAmountsOut(
            args.arg0,
            args.arg1
        )
        console.log(result.toString())
    })

subtask("router.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("router.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("router.quote")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).quote(
            args.arg0,
            args.arg1,
            args.arg2
        )
        console.log(result.toString())
    })

subtask("router.swapRewards")
    .setAction(async () => {
        const result = await (await contract()).swapRewards()
        console.log(result.toString())
    })



// WRITE


subtask("router.addLiquidity")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .addPositionalParam("arg6")
    .addPositionalParam("arg7")
    .setAction(async (args) => {
        const result = await (await contract()).addLiquidity(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
            args.arg6,
            args.arg7
        )
    })

subtask("router.addLiquidityETH")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .addPositionalParam("arg6")
    .setAction(async (args) => {
        const result = await (await contract()).addLiquidityETH(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
            args.arg6
        )
    })

subtask("router.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("router.removeLiquidity")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .addPositionalParam("arg6")
    .setAction(async (args) => {
        const result = await (await contract()).removeLiquidity(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
            args.arg6
        )
    })

subtask("router.removeLiquidityETH")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).removeLiquidityETH(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })

subtask("router.removeLiquidityETHSupportingFeeOnTranferTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).removeLiquidityETHSupportingFeeOnTranferTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })

subtask("router.removeLiquidityETHWithPermit")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .addPositionalParam("arg6")
    .addPositionalParam("arg7")
    .addPositionalParam("arg8")
    .addPositionalParam("arg9")
    .setAction(async (args) => {
        const result = await (await contract()).removeLiquidityETHWithPermit(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
            args.arg6,
            args.arg7,
            args.arg8,
            args.arg9,
        )
    })

subtask("router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .addPositionalParam("arg6")
    .addPositionalParam("arg7")
    .addPositionalParam("arg8")
    .addPositionalParam("arg9")
    .setAction(async (args) => {
        const result = await (await contract()).removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
            args.arg6,
            args.arg7,
            args.arg8,
            args.arg9,
        )
    })

subtask("router.removeLiquidityWithPermit")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .addPositionalParam("arg6")
    .addPositionalParam("arg7")
    .addPositionalParam("arg8")
    .addPositionalParam("arg9")
    .addPositionalParam("arg10")
    .setAction(async (args) => {
        const result = await (await contract()).removeLiquidityWithPermit(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
            args.arg6,
            args.arg7,
            args.arg8,
            args.arg9,
            args.arg10,
        )
    })

subtask("router.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("router.setSwapReward")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setSwapRewards(
            args.arg0,
        )
    })

subtask("router.swapETHForExactTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapETHForExactTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapExactETHForTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapExactETHForTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapExactETHForTokensSupportingFeeOnTransferTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapExactETHForTokensSupportingFeeOnTransferTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapExactTokensForETH")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapExactTokensForETH(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapExactTokensForETHSupportingFeeOnTransferTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapExactTokensForETHSupportingFeeOnTransferTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapExactTokensForTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapExactTokensForTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapExactTokensForTokensSupportingFeeOnTransferTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapTokensForExactETH")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapTokensForExactETH(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.swapTokensForExactTokens")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).swapTokensForExactTokens(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("router.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0,
        )
    })

subtask("router.")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })


