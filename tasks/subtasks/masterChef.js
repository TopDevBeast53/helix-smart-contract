const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "MasterChef"
const address = contracts.masterChef[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// BONUS_MULTIPLIER

// bucketInfo

// depositedHelix

// devPercent

// devaddr

// feeMinter

// getBucketYield

// getDevToMintPerBlock

// getLpToken
subtask("masterChef.getLpToken")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getLpToken(args.arg0)
        console.log(result.toString())
    })


// getMultiplier

// getPoolId
subtask("masterChef.getPoolId")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getPoolId(args.arg0)
        console.log(result.toString())
    })


// getStakeToMintPerBlock

// getToMintPerBlock

// helixToken

// lastBlockDevWithdraw
subtask("masterChef.lastBlockDevWithdraw")
    .setAction(async () => {
        const result = await (await contract()).lastBlockDevWithdraw()
        console.log(result.toString())
    })

// owner

// paused

// pendingHelixToken
subtask("masterChef.pendingHelixToken")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).pendingHelixToken(args.arg0, args.arg1)
        console.log(result.toString())
    })

// percentDec

// poolIds

// poolInfo

// poolLength

// refRegister

// stakingPercent

// startBlock

// timelockOwner

// totalAllocPoint

// userInfo


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

// bucketDeposit

// bucketWithdraw

// bucketWithdrawAmountTo

// bucketWithdrawYieldTo

// deposit

subtask("masterChef.emergencyWithdraw")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).emergencyWithdraw(args.arg0)
    })

// enterStaking

// initialize

// leaveStaking

// massUpdatePools

// pause

// renounceOwnership

// renounceTimelockOwnership

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

// setDevAddress

// setDevAndStakingPercents

// setFeeMinter

// setReferralRegister

// transferOwnership

// transferTimelockOwnership

// unpause

// updateBucket

// updateMultiplier

// updatePool

// withdraw

// withdrawDevAndRefFee
