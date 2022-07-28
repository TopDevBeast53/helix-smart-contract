const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "ReferralRegister"
const address = contracts.referralRegister[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


task("referralRegister.collectorPercent")
    .setAction(async () => {
        const result = await (await contract()).collectorPercent()
        console.log(result.toString())
    })

task("referralRegister.decimals")
    .setAction(async () => {
        const result = await (await contract()).decimals()
        console.log(result.toString())
    })

task("referralRegister.feeHandler")
    .setAction(async () => {
        const result = await (await contract()).feeHandler()
        console.log(result.toString())
    })

task("referralRegister.feeMinter")
    .setAction(async () => {
        const result = await (await contract()).feeMinter()
        console.log(result.toString())
    })

task("referralRegister.getCollectorPercent")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorPercent(args.amount)
        console.log(result.toString())
    })

task("referralRegister.getCollectorFeeSplit")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorFeeSplit(args.amount)
        console.log(result.toString())
    })

task("referralRegister.getRecorder")
    .addPositionalParam("index")
    .setAction(async (args) => {
        const result = await (await contract()).getRecorder(args.index)
        console.log(result.toString())
    })

task("referralRegister.getRecorderLength")
    .setAction(async () => {
        const result = await (await contract()).getRecorderLength()
        console.log(result.toString())
    })


task("referralRegister.getReferees")
    .addPositionalParam("referrer")
    .setAction(async (args) => {
        const result = await (await contract()).getReferees(args.referrer)
        console.log(result.toString())
    })

task("referralRegister.getToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).getToMintPerBlock()
        console.log(result.toString())
    })

task("referralRegister.helixToken")
    .setAction(async () => {
        const result = await (await contract()).helixToken()
        console.log(result.toString())
    })

task("referralRegister.isFeeHandlerSet")
    .setAction(async () => {
        const result = await (await contract()).isFeeHandlerSet()
        console.log(result.toString())
    })

task("referralRegister.isRecorder")
    .addPositionalParam("address")
    .setAction(async (args) => {
        const result = await (await contract()).isRecorder(args.address)
        console.log(result.toString())
    })

task("referralRegister.lastMintBlock")
    .setAction(async () => {
        const result = await (await contract()).lastMintBlock()
        console.log(result.toString())
    })

task("referralRegister.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

task("referralRegister.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

task("referralRegister.referees")
    .addPositionalParam("address")
    .addPositionalParam("uint256")
    .setAction(async (args) => {
        const result = await (await contract()).referees(args.address, args.uint256)
        console.log(result.toString())
    })

task("referralRegister.referrers")
    .addPositionalParam("address")
    .setAction(async (args) => {
        const result = await (await contract()).referrers(args.address)
        console.log(result.toString())
    })

task("referralRegister.rewards")
    .addPositionalParam("address")
    .setAction(async (args) => {
        const result = await (await contract()).rewards(args.address)
        console.log(result.toString())
    })

task("referralRegister.stakeRewardPercent")
    .setAction(async () => {
        const result = await (await contract()).stakeRewardPercent()
        console.log(result.toString())
    })

task("referralRegister.swapRewardPercent")
    .setAction(async () => {
        const result = await (await contract()).swapRewardPercent()
        console.log(result.toString())
    })

task("referralRegister.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })



// WRITE


task("referralRegister.addRecorder")
    .addPositionalParam("recorder")
    .setAction(async (args) => {
        const result = await (await contract()).addRecorder(args.recorder)
    })

task("referralRegister.addReferrer")
    .addPositionalParam("referrer")
    .setAction(async (args) => {
        const result = await (await contract()).addReferrer(args.referrer)
    })

// initialize

task("referralRegister.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })


task("referralRegister.removeRecorder")
    .addPositionalParam("recorder")
    .setAction(async (args) => {
        const result = await (await contract()).removeRecorder(args.recorder)
    })


task("referralRegister.removeReferrer")
    .setAction(async () => {
        const result = await (await contract()).removeReferrer()
    })


// renounceOwnership

// renounceTimelockOwnership

task("referralRegister.rewardStake")
    .addPositionalParam("referred")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).rewardStake(args.referred, args.amount)
    })

task("referralRegister.rewardSwap")
    .addPositionalParam("referred")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).rewardSwap(args.referred, args.amount)
    })

task("referralRegister.setCollectorPercentAndDecimals")
    .addPositionalParam("collectorPercent")
    .addPositionalParam("decimals")
    .setAction(async (args) => {
        const result = await (await contract()).setCollectorPercentAndDecimals(
            args.collectorPercent, 
            args.decimals
        )
    })

task("referralRegister.setFeeHandler")
    .addPositionalParam("feeHandler")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeHandler(args.feeHandler)
    })

task("referralRegister.setFeeMinter")
    .addPositionalParam("feeMinter")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeHandler(args.feeMinter)
    })


task("referralRegister.setLastRewardBlock")
    .addPositionalParam("lastMintBlock")
    .setAction(async (args) => {
        const result = await (await contract()).setLastRewardBlock(args.lastMintBlock)
    })

task("referralRegister.setStakeRewardPercent")
    .addPositionalParam("stakeRewardPercent")
    .setAction(async (args) => {
        const result = await (await contract()).setStakeRewardPercent(args.stakeRewardPercent)
    })

task("referralRegister.setSwapRewardPercent")
    .addPositionalParam("swapRewardPercent")
    .setAction(async (args) => {
        const result = await (await contract()).setSwapRewardPercent(args.swapRewardPercent)
    })

// transferOwnership

// transferTimelockOwnership

task("referralRegister.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

task("referralRegister.update")
    .setAction(async () => {
        const result = await (await contract()).update()
    })

task("referralRegister.withdraw")
    .setAction(async () => {
        const result = await (await contract()).withdraw()
    })

