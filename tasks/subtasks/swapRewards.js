const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "SwapRewards"
const address = contracts.swapRewards[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("swapRewards.helixToken")
    .setAction(async () => {
        const result = await (await contract()).helixToken()
        console.log(result.toString())
    })

subtask("swapRewards.oracleFactory")
    .setAction(async () => {
        const result = await (await contract()).oracleFactory()
        console.log(result.toString())
    })

subtask("swapRewards.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("swapRewards.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("swapRewards.refReg")
    .setAction(async () => {
        const result = await (await contract()).refReg()
        console.log(result.toString())
    })

subtask("swapRewards.router")
    .setAction(async () => {
        const result = await (await contract()).router()
        console.log(result.toString())
    })


// WRITE


subtask("swapRewards.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("swapRewards.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("swapRewards.setHelixToken")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setHelixToken(
            args.arg0,
        )
    })

subtask("swapRewards.setOracleFactory")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setOracleFactory(
            args.arg0,
        )
    })

subtask("swapRewards.setRefReg")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setRefReg(
            args.arg0,
        )
    })

subtask("swapRewards.setRouter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setRouter(
            args.arg0,
        )
    })

subtask("swapRewards.swap")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).swap(
            args.arg0, 
            args.arg1, 
            args.arg2
        )
    })

subtask("swapRewards.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0,
        )
    })

subtask("swapRewards.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

