const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "ReferralRegister"
const address = contracts.referralRegister[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("referralRegister.collectorPercent")
    .setAction(async () => {
        const result = await (await contract()).collectorPercent()
        console.log(result.toString())
    })

subtask("referralRegister.decimals")
    .setAction(async () => {
        const result = await (await contract()).decimals()
        console.log(result.toString())
    })

subtask("referralRegister.feeHandler")
    .setAction(async () => {
        const result = await (await contract()).feeHandler()
        console.log(result.toString())
    })

subtask("referralRegister.feeMinter")
    .setAction(async () => {
        const result = await (await contract()).feeMinter()
        console.log(result.toString())
    })

subtask("referralRegister.getCollectorPercent")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorPercent(args.arg0)
        console.log(result.toString())
    })

subtask("referralRegister.getCollectorFeeSplit")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getCollectorFeeSplit(args.arg0)
        console.log(result.toString())
    })

subtask("referralRegister.getRecorder")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getRecorder(args.arg0)
        console.log(result.toString())
    })

subtask("referralRegister.getRecorderLength")
    .setAction(async () => {
        const result = await (await contract()).getRecorderLength()
        console.log(result.toString())
    })


subtask("referralRegister.getReferees")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getReferees(args.arg0)
        console.log(result.toString())
    })

subtask("referralRegister.getToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).getToMintPerBlock()
        console.log(result.toString())
    })

subtask("referralRegister.helixToken")
    .setAction(async () => {
        const result = await (await contract()).helixToken()
        console.log(result.toString())
    })

subtask("referralRegister.isFeeHandlerSet")
    .setAction(async () => {
        const result = await (await contract()).isFeeHandlerSet()
        console.log(result.toString())
    })

subtask("referralRegister.isRecorder")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isRecorder(args.arg0)
        console.log(result.toString())
    })

subtask("referralRegister.lastMintBlock")
    .setAction(async () => {
        const result = await (await contract()).lastMintBlock()
        console.log(result.toString())
    })

subtask("referralRegister.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("referralRegister.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("referralRegister.referees")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).referees(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("referralRegister.referrers")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).referrers(args.arg0)
        console.log(result.toString())
    })

subtask("referralRegister.rewards")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).rewards(args.arg0)
        console.log(result.toString())
    })

subtask("referralRegister.stakeRewardPercent")
    .setAction(async () => {
        const result = await (await contract()).stakeRewardPercent()
        console.log(result.toString())
    })

subtask("referralRegister.swapRewardPercent")
    .setAction(async () => {
        const result = await (await contract()).swapRewardPercent()
        console.log(result.toString())
    })

subtask("referralRegister.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })



// WRITE


subtask("referralRegister.addRecorder")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).addRecorder(args.arg0)
    })

subtask("referralRegister.addReferrer")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).addReferrer(args.arg0)
    })

// initialize

subtask("referralRegister.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })


subtask("referralRegister.removeRecorder")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).removeRecorder(args.arg0)
    })


subtask("referralRegister.removeReferrer")
    .setAction(async () => {
        const result = await (await contract()).removeReferrer()
    })


// renounceOwnership

// renounceTimelockOwnership

subtask("referralRegister.rewardStake")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).rewardStake(args.arg0, args.arg1)
    })

subtask("referralRegister.rewardSwap")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).rewardSwap(args.arg0, args.arg1)
    })

subtask("referralRegister.setCollectorPercentAndDecimals")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setCollectorPercentAndDecimals(
            args.arg0, 
            args.arg1
        )
    })

subtask("referralRegister.setFeeHandler")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeHandler(args.arg0)
    })

subtask("referralRegister.setFeeMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeHandler(args.arg0)
    })


subtask("referralRegister.setLastRewardBlock")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setLastRewardBlock(args.arg0)
    })

subtask("referralRegister.setStakeRewardPercent")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setStakeRewardPercent(args.arg0)
    })

subtask("referralRegister.setSwapRewardPercent")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setSwapRewardPercent(args.arg0)
    })

// transferOwnership

// transferTimelockOwnership

subtask("referralRegister.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

subtask("referralRegister.update")
    .setAction(async () => {
        const result = await (await contract()).update()
    })

subtask("referralRegister.withdraw")
    .setAction(async () => {
        const result = await (await contract()).withdraw()
    })

