const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixVault"
const address = contracts.helixVault[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("helixVault.MAX_DECIMALS")
    .setAction(async () => {
        const result = await (await contract()).MAX_DECIMALS()
        console.log(result.toString())
    })

subtask("helixVault.PRECISION_FACTOR")
    .setAction(async () => {
        const result = await (await contract()).PRECISION_FACTOR()
        console.log(result.toString())
    })

subtask("helixVault.accTokenPerShare")
    .setAction(async () => {
        const result = await (await contract()).accTokenPerShare()
        console.log(result.toString())
    })

subtask("helixVault.collectorPercent")
    .setAction(async () => {
        const result = await (await contract()).collectorPercent()
        console.log(result.toString())
    })

subtask("helixVault.decimals")
    .setAction(async () => {
        const result = await (await contract()).decimals()
        console.log(result.toString())
    })

subtask("helixVault.depositId")
    .setAction(async () => {
        const result = await (await contract()).depositId()
        console.log(result.toString())
    })

subtask("helixVault.depositIds")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).depositIds(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("helixVault.deposits")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).deposits(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.durations")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).durations(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.feeHandler")
    .setAction(async () => {
        const result = await (await contract()).feeHandler()
        console.log(result.toString())
    })

subtask("helixVault.feeMinter")
    .setAction(async () => {
        const result = await (await contract()).feeMinter()
        console.log(result.toString())
    })

subtask("helixVault.getBlocksDifference")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getBlocksDifference(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("helixVault.getCollectorFee")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorFee(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.getCollectorFeeSplit")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorFeeSplit(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.getDeposit")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getDeposit(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.getDepositAmount")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getDepositAmount(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.getDepositIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getDepositIds(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.getDurations")
    .setAction(async () => {
        const result = await (await contract()).getDurations()
        for (let i = 0; i < result.length; i++) {
            console.log(result[i].toString())
        }
    })

subtask("helixVault.getToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).getToMintPerBlock()
        console.log(result.toString())
    })

subtask("helixVault.isFeeHandlerSet")
    .setAction(async () => {
        const result = await (await contract()).isFeeHandlerSet()
        console.log(result.toString())
    })

subtask("helixVault.lastRewardBlock")
    .setAction(async () => {
        const result = await (await contract()).lastRewardBlock()
        console.log(result.toString())
    })

subtask("helixVault.lastUpdateBlock")
    .setAction(async () => {
        const result = await (await contract()).lastUpdateBlock()
        console.log(result.toString())
    })

subtask("helixVault.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("helixVault.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("helixVault.pendingReward")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).pendingReward(args.arg0)
        console.log(result.toString())
    })

subtask("helixVault.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })

subtask("helixVault.token")
    .setAction(async () => {
        const result = await (await contract()).token()
        console.log(result.toString())
    })


// WRITE


subtask("helixVault.addDuration")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).addDuration(args.arg0, args.arg1)
    })

subtask("helixVault.claimReward")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).claimReward(args.arg0)
    })

subtask("helixVault.compount")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).compound(args.arg0)
    })

subtask("helixVault.emergencyWithdraw")
    .setAction(async () => {
        const result = await (await contract()).emergencyWithdraw()
    })

subtask("helixVault.initialize")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(
            args.arg0, 
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })

subtask("helixVault.newDeposit")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).newDeposit(args.arg0, args.arg1)
    })

subtask("helixVault.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("helixVault.removeDuration")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).removeDuration(args.arg0)
    })

// renounceOwnership
subtask("helixVault.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

// renounceTimelockOwnership
subtask("helixVault.renounceTimelockOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceTimelockOwnership()
    })

subtask("helixVault.setCollectorPercentAndDecimals")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setCollectorPercentAndDecimals(args.arg0, args.arg1)
    })

subtask("helixVault.setDuration")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).setDuration(
            args.arg0, 
            args.arg1, 
            args.arg2
        )
    })

subtask("helixVault.setFeeHandler")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeHandler(args.arg0)
    })

subtask("helixVault.setFeeMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeMinter(args.arg0)
    })

subtask("helixVault.setLastRewardBlock")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setLastRewardBlock(args.arg0)
    })

subtask("helixVault.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(args.arg0)
    })

subtask("helixVault.transferTimelockOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferTimelockOwnership(args.arg0)
    })

subtask("helixVault.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

subtask("helixVault.updateDeposit")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).updateDeposit(args.arg0, args.arg1)
    })

subtask("helixVault.updatePool")
    .setAction(async () => {
        const result = await (await contract()).updatePool()
    })

subtask("helixVault.withdraw")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).withdraw(args.arg0, args.arg1)
    })
