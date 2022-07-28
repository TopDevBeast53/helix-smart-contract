const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

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
task("masterChef.getLpToken")
    .addPositionalParam("pid")
    .setAction(async (args) => {
        const result = await (await contract()).getLpToken(args.pid)
        console.log(result.toString())
    })


// getMultiplier

// getPoolId
task("masterChef.getPoolId")
    .addPositionalParam("lpToken")
    .setAction(async (args) => {
        const result = await (await contract()).getPoolId(args.lpToken)
        console.log(result.toString())
    })


// getStakeToMintPerBlock

// getToMintPerBlock

// helixToken

// lastBlockDevWithdraw
task("masterChef.lastBlockDevWithdraw")
    .setAction(async () => {
        const result = await (await contract()).lastBlockDevWithdraw()
        console.log(result.toString())
    })

// owner

// paused

// pendingHelixToken
task("masterChef.pendingHelixToken")
    .addPositionalParam("pid")
    .addPositionalParam("user")
    .setAction(async (args) => {
        const result = await (await contract()).pendingHelixToken(args.pid, args.user)
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


task("masterChef.add")
    .addPositionalParam("allocPoint")
    .addPositionalParam("lpToken")
    .addPositionalParam("withUpdate")
    .setAction(async (args) => {
        const result = await (await contract()).add(
            args.allocPoint,
            args.lpToken,
            args.withUpdate
        )
    })

// bucketDeposit

// bucketWithdraw

// bucketWithdrawAmountTo

// bucketWithdrawYieldTo

// deposit

task("masterChef.emergencyWithdraw")
    .addPositionalParam("pid")
    .setAction(async (args) => {
        const result = await (await contract()).emergencyWithdraw(args.pid)
    })

// enterStaking

// initialize

// leaveStaking

// massUpdatePools

// pause

// renounceOwnership

// renounceTimelockOwnership

task("masterChef.set")
    .addPositionalParam("pid")
    .addPositionalParam("allocPoint")
    .addPositionalParam("withUpdate")
    .setAction(async (args) => {
        const result = await (await contract()).set(
            args.pid,
            args.allocPoint,
            args.withUpdate
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
