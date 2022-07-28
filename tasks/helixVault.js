const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "HelixVault"
const address = contracts.helixVault[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


task("helixVault.MAX_DECIMALS")
    .setAction(async () => {
        const result = await (await contract()).MAX_DECIMALS()
        console.log(result.toString())
    })

task("helixVault.PRECISION_FACTOR")
    .setAction(async () => {
        const result = await (await contract()).PRECISION_FACTOR()
        console.log(result.toString())
    })

task("helixVault.accTokenPerShare")
    .setAction(async () => {
        const result = await (await contract()).accTokenPerShare()
        console.log(result.toString())
    })

task("helixVault.collectorPercent")
    .setAction(async () => {
        const result = await (await contract()).collectorPercent()
        console.log(result.toString())
    })

task("helixVault.decimals")
    .setAction(async () => {
        const result = await (await contract()).decimals()
        console.log(result.toString())
    })

task("helixVault.depositId")
    .setAction(async () => {
        const result = await (await contract()).depositId()
        console.log(result.toString())
    })

task("helixVault.depositIds")
    .addPositionalParam("address")
    .addPositionalParam("uint256")
    .setAction(async (args) => {
        const result = await (await contract()).depositIds(args.address, args.uint256)
        console.log(result.toString())
    })


task("helixVault.deposits")
    .addPositionalParam("uint256")
    .setAction(async (args) => {
        const result = await (await contract()).deposits(args.uint256)
        console.log(result.toString())
    })

task("helixVault.durations")
    .addPositionalParam("uint256")
    .setAction(async (args) => {
        const result = await (await contract()).durations(args.uint256)
        console.log(result.toString())
    })

task("helixVault.feeHandler")
    .setAction(async () => {
        const result = await (await contract()).feeHandler()
        console.log(result.toString())
    })

task("helixVault.feeMinter")
    .setAction(async () => {
        const result = await (await contract()).feeMinter()
        console.log(result.toString())
    })

task("helixVault.getBlocksDifference")
    .addPositionalParam("from")
    .addPositionalParam("to")
    .setAction(async (args) => {
        const result = await (await contract()).getBlocksDifference(args.from, args.to)
        console.log(result.toString())
    })

task("helixVault.getCollectorFee")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorFee(args.amount)
        console.log(result.toString())
    })

task("helixVault.getCollectorFeeSplit")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorFeeSplit(args.amount)
        console.log(result.toString())
    })

task("helixVault.getDeposit")
    .addPositionalParam("depositId")
    .setAction(async (args) => {
        const result = await (await contract()).getDeposit(args.depositId)
        console.log(result.toString())
    })

task("helixVault.getDepositAmount")
    .addPositionalParam("user")
    .setAction(async (args) => {
        const result = await (await contract()).getDepositAmount(args.user)
        console.log(result.toString())
    })

task("helixVault.getDepositIds")
    .addPositionalParam("user")
    .setAction(async (args) => {
        const result = await (await contract()).getDepositIds(args.user)
        console.log(result.toString())
    })

task("helixVault.getDurations")
    .setAction(async () => {
        const result = await (await contract()).getDurations()
        for (let i = 0; i < result.length; i++) {
            console.log(result[i].toString())
        }
    })

task("helixVault.getToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).getToMintPerBlock()
        console.log(result.toString())
    })

task("helixVault.isFeeHandlerSet")
    .setAction(async () => {
        const result = await (await contract()).isFeeHandlerSet()
        console.log(result.toString())
    })

task("helixVault.lastRewardBlock")
    .setAction(async () => {
        const result = await (await contract()).lastRewardBlock()
        console.log(result.toString())
    })

task("helixVault.lastUpdateBlock")
    .setAction(async () => {
        const result = await (await contract()).lastUpdateBlock()
        console.log(result.toString())
    })

task("helixVault.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

task("helixVault.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

task("helixVault.pendingReward")
    .addPositionalParam("depositId")
    .setAction(async (args) => {
        const result = await (await contract()).pendingReward(args.depositId)
        console.log(result.toString())
    })

task("helixVault.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })

task("helixVault.token")
    .setAction(async () => {
        const result = await (await contract()).token()
        console.log(result.toString())
    })


// WRITE


task("helixVault.addDuration")
    .addPositionalParam("duration")
    .addPositionalParam("weight")
    .setAction(async (args) => {
        const result = await (await contract()).addDuration(args.duration, args.weight)
    })

task("helixVault.claimReward")
    .addPositionalParam("depositId")
    .setAction(async (args) => {
        const result = await (await contract()).claimReward(args.depositId)
    })

task("helixVault.compount")
    .addPositionalParam("depositId")
    .setAction(async (args) => {
        const result = await (await contract()).compound(args.depositId)
    })

task("helixVault.emergencyWithdraw")
    .setAction(async () => {
        const result = await (await contract()).emergencyWithdraw()
    })


// initialize

task("helixVault.newDeposit")
    .addPositionalParam("amount")
    .addPositionalParam("index")
    .setAction(async (args) => {
        const result = await (await contract()).newDeposit(args.amount, args.index)
    })

task("helixVault.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

task("helixVault.removeDuration")
    .addPositionalParam("index")
    .setAction(async (args) => {
        const result = await (await contract()).removeDuration(args.index)
    })

// renounceOwnership

// renounceTimelockOwnership

task("helixVault.setCollectorPercentAndDecimals")
    .addPositionalParam("collectorPercent")
    .addPositionalParam("decimals")
    .setAction(async (args) => {
        const result = await (await contract()).setCollectorPercent(args.collectorPercent, args.decimals)
    })

task("helixVault.setDuration")
    .addPositionalParam("index")
    .addPositionalParam("duration")
    .addPositionalParam("weight")
    .setAction(async (args) => {
        const result = await (await contract()).setDuration(args.index, args.duration, args.weight)
    })

task("helixVault.setFeeHandler")
    .addPositionalParam("feeHandler")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeHandler(args.feeHandler)
    })

task("helixVault.setFeeMinter")
    .addPositionalParam("feeMinter")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeMinter(args.feeMinter)
    })

task("helixVault.setLastRewardBlock")
    .addPositionalParam("lastRewardBlock")
    .setAction(async (args) => {
        const result = await (await contract()).setLastRewardBlock(args.lastRewardBlock)
    })


// transferOwnership

// transferTimelockOwnership

task("helixVault.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

task("helixVault.updateDeposit")
    .addPositionalParam("amount")
    .addPositionalParam("depositId")
    .setAction(async (args) => {
        const result = await (await contract()).updateDeposit(args.amount, args.depositId)
    })

task("helixVault.updatePool")
    .setAction(async () => {
        const result = await (await contract()).updatePool()
    })

task("helixVault.withdraw")
    .addPositionalParam("amount")
    .addPositionalParam("depositId")
    .setAction(async (args) => {
        const result = await (await contract()).withdraw(args.amount, args.depositId)
    })
