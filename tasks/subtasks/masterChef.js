const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "MasterChef"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.masterChef[await chainId()]
    }
)


// READ


subtask("masterChef.BONUS_MULTIPLIER")
    .setAction(async () => {
        const result = await (await contract()).BONUS_MULTIPLIER()
        console.log(result.toString())
    })

subtask("masterChef.bucketInfo")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).bucketInfo(
            args.arg0,
            args.arg1,
            args.arg2,
        )
        console.log(result.toString())
    })

subtask("masterChef.depositedHelix")
    .setAction(async () => {
        const result = await (await contract()).depositedHelix()
        console.log(result.toString())
    })

subtask("masterChef.devPercent")
    .setAction(async () => {
        const result = await (await contract()).devPercent()
        console.log(result.toString())
    })

subtask("masterChef.devaddr")
    .setAction(async () => {
        const result = await (await contract()).devaddr()
        console.log(result.toString())
    })

subtask("masterChef.feeMinter")
    .setAction(async () => {
        const result = await (await contract()).feeMinter()
        console.log(result.toString())
    })

subtask("masterChef.getBucketYield")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getBucketYield(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("masterChef.getDevToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).getDevToMintPerBlock()
        console.log(result.toString())
    })

subtask("masterChef.getLpToken")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getLpToken(args.arg0)
        console.log(result.toString())
    })

subtask("masterChef.getMultiplier")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getMultiplier(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("masterChef.getPoolId")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getPoolId(args.arg0)
        console.log(result.toString())
    })

subtask("masterChef.getStakeToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).getStakeToMintPerBlock()
        console.log(result.toString())
    })

subtask("masterChef.getToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).getToMintPerBlock()
        console.log(result.toString())
    })

subtask("masterChef.helixToken")
    .setAction(async () => {
        const result = await (await contract()).helixToken()
        console.log(result.toString())
    })

subtask("masterChef.lastBlockDevWithdraw")
    .setAction(async () => {
        const result = await (await contract()).lastBlockDevWithdraw()
        console.log(result.toString())
    })

subtask("masterChef.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("masterChef.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("masterChef.pendingHelixToken")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).pendingHelixToken(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("masterChef.percentDec")
    .setAction(async () => {
        const result = await (await contract()).percentDec()
        console.log(result.toString())
    })

subtask("masterChef.poolIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).poolIds(
            args.arg0, 
        )
        console.log(result.toString())
    })

subtask("masterChef.poolInfo")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).poolInfo(
            args.arg0, 
        )
        console.log(result.toString())
    })

subtask("masterChef.poolLength")
    .setAction(async () => {
        const result = await (await contract()).poolLength()
        console.log(result.toString())
    })

subtask("masterChef.refRegister")
    .setAction(async () => {
        const result = await (await contract()).refRegister()
        console.log(result.toString())
    })

subtask("masterChef.stakingPercent")
    .setAction(async () => {
        const result = await (await contract()).stakingPercent()
        console.log(result.toString())
    })

subtask("masterChef.startBlock")
    .setAction(async () => {
        const result = await (await contract()).startBlock()
        console.log(result.toString())
    })

subtask("masterChef.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })

subtask("masterChef.totalAllocPoint")
    .setAction(async () => {
        const result = await (await contract()).totalAllocPoint()
        console.log(result.toString())
    })

subtask("masterChef.userInfo")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).userInfo(
            args.arg0, 
            args.arg1
        )
        console.log(result.toString())
    })



// WRITE


subtask("masterChef.add")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).add(
            args.arg0,
            args.arg1,
            args.arg2
        )
    })

subtask("masterChef.bucketDeposit")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).bucketDeposit(
            args.arg0,
            args.arg1,
            args.arg2
        )
    })

subtask("masterChef.bucketWithdraw")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).bucketWithdraw(
            args.arg0,
            args.arg1,
            args.arg2
        )
    })

subtask("masterChef.bucketWithdrawAmountTo")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).bucketWithdrawAmountTo(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3
        )
    })

subtask("masterChef.bucketWithdrawYieldTo")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).bucketWithdrawYieldTo(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3
        )
    })

subtask("masterChef.deposit")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).deposit(
            args.arg0,
            args.arg1,
        )
    })

subtask("masterChef.emergencyWithdraw")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).emergencyWithdraw(args.arg0)
    })

subtask("masterChef.enterStaking")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).enterStaking(
            args.arg0,
        )
    })

subtask("masterChef.initialize")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .addPositionalParam("arg6")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
            args.arg5,
        )
    })

subtask("masterChef.leaveStaking")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).leaveStaking(
            args.arg0,
        )
    })

subtask("masterChef.massUpdatePools")
    .setAction(async () => {
        const result = await (await contract()).massUpdatePools()
    })

subtask("masterChef.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("masterChef.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("masterChef.renounceTimelockOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceTimelockOwnership()
    })

subtask("masterChef.set")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).set(
            args.arg0,
            args.arg1,
            args.arg2
        )
    })

subtask("masterChef.setDevAddress")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setDevAddress(
            args.arg0,
        )
    })

subtask("masterChef.setDevAndStakingPercents")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setDevAndStakingPercents(
            args.arg0,
            args.arg1,
        )
    })

subtask("masterChef.setFeeMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeMinter(
            args.arg0,
        )
    })

subtask("masterChef.setReferralRegister")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setReferralRegister(
            args.arg0,
        )
    })

subtask("masterChef.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0,
        )
    })

subtask("masterChef.transferTimelockOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferTimelockOwnership(
            args.arg0,
        )
    })

subtask("masterChef.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

subtask("masterChef.updateBucket")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).updateBucket(
            args.arg0,
            args.arg1,
        )
    })

subtask("masterChef.updateMultiplier")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).updateMultiplier(
            args.arg0,
        )
    })

subtask("masterChef.updatePool")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).updatePool(
            args.arg0,
        )
    })

subtask("masterChef.withdraw")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).withdraw(
            args.arg0,
            args.arg1,
        )
    })

subtask("masterChef.withdrawDevAndRefFee")
    .setAction(async () => {
        const result = await (await contract()).withdrawDevAndRefFee()
    })

