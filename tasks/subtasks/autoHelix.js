const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "AutoHelix"
const address = contracts.autoHelix[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("autoHelix.MAX_CALL_FEE")
    .setAction(async () => {
        const result = await (await contract()).MAX_CALL_FEE()
        console.log(result.toString())
    })

subtask("autoHelix.MAX_PERFORMANCE_FEE")
    .setAction(async () => {
        const result = await (await contract()).MAX_PERFORMANCE_FEE()
        console.log(result.toString())
    })

subtask("autoHelix.MAX_WITHDRAW_FEE")
    .setAction(async () => {
        const result = await (await contract()).MAX_WITHDRAW_FEE()
        console.log(result.toString())
    })

subtask("autoHelix.MAX_WITHDRAW_FEE_PERIOD")
    .setAction(async () => {
        const result = await (await contract()).MAX_WITHDRAW_FEE_PERIOD()
        console.log(result.toString())
    })

subtask("autoHelix.available")
    .setAction(async () => {
        const result = await (await contract()).available()
        console.log(result.toString())
    })

subtask("autoHelix.balanceOf")
    .setAction(async () => {
        const result = await (await contract()).balanceOf()
        console.log(result.toString())
    })

subtask("autoHelix.calculateHarvestRewards")
    .setAction(async () => {
        const result = await (await contract()).calculateHarvestRewards()
        console.log(result.toString())
    })

subtask("autoHelix.calculateTotalPendingHelixRewards")
    .setAction(async () => {
        const result = await (await contract()).calculateTotalPendingHelixRewards()
        console.log(result.toString())
    })

subtask("autoHelix.callFee")
    .setAction(async () => {
        const result = await (await contract()).callFee()
        console.log(result.toString())
    })

subtask("autoHelix.getPricePerFullShare")
    .setAction(async () => {
        const result = await (await contract()).getPricePerFullShare()
        console.log(result.toString())
    })

subtask("autoHelix.lastHarvestedTime")
    .setAction(async () => {
        const result = await (await contract()).lastHarvestedTime()
        console.log(result.toString())
    })

subtask("autoHelix.masterChef")
    .setAction(async () => {
        const result = await (await contract()).masterChef()
        console.log(result.toString())
    })

subtask("autoHelix.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("autoHelix.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("autoHelix.performanceFee")
    .setAction(async () => {
        const result = await (await contract()).performanceFee()
        console.log(result.toString())
    })

subtask("autoHelix.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })

subtask("autoHelix.token")
    .setAction(async () => {
        const result = await (await contract()).token()
        console.log(result.toString())
    })

subtask("autoHelix.totalShares")
    .setAction(async () => {
        const result = await (await contract()).totalShares()
        console.log(result.toString())
    })

subtask("autoHelix.treasury")
    .setAction(async () => {
        const result = await (await contract()).treasury()
        console.log(result.toString())
    })

subtask("autoHelix.userInfo")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).userInfo(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("autoHelix.withdrawFee")
    .setAction(async () => {
        const result = await (await contract()).withdrawFee()
        console.log(result.toString())
    })

subtask("autoHelix.withdrawFeePeriod")
    .setAction(async () => {
        const result = await (await contract()).withdrawFeePeriod()
        console.log(result.toString())
    })



// WRITE


subtask("autoHelix.deposit")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).deposit(
            args.arg0,
        )
    })

subtask("autoHelix.emergencyWithdraw")
    .setAction(async () => {
        const result = await (await contract()).emergencyWithdraw()
    })

subtask("autoHelix.harvest")
    .setAction(async () => {
        const result = await (await contract()).harvest()
    })

subtask("autoHelix.inCaseTokensGetStuck")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).inCaseTokensGetStuck(
            args.arg0,
        )
    })

subtask("autoHelix.initialize")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(
            args.arg0,
            args.arg1,
            args.arg2,
        )
    })

subtask("autoHelix.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("autoHelix.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("autoHelix.renounceTimelockOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceTimelockOwnership()
    })

subtask("autoHelix.setCallFee")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setCallFee(
            args.arg0,
        )
    })

subtask("autoHelix.setMasterChef")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setMasterChef(
            args.arg0,
        )
    })

subtask("autoHelix.setPerformanceFee")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setPerformanceFee(
            args.arg0,
        )
    })

subtask("autoHelix.setTreasury")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setTreasury(
            args.arg0,
        )
    })

subtask("autoHelix.setWithdrawFee")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setWithdrawFee(
            args.arg0,
        )
    })

subtask("autoHelix.setWithdrawFeePeriod")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setWithdrawFeePeriod(
            args.arg0,
        )
    })

subtask("autoHelix.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0,
        )
    })

subtask("autoHelix.transferTimelockOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferTimelockOwnership(
            args.arg0,
        )
    })

subtask("autoHelix.unpause")
    .setAction(async (args) => {
        const result = await (await contract()).unpause()
    })

subtask("autoHelix.withdraw")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).withdraw(
            args.arg0,
        )
    })

subtask("autoHelix.withdrawAll")
    .setAction(async (args) => {
        const result = await (await contract()).withdrawAll()
    })

