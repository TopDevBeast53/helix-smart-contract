const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixMigrator"
const address = contracts.helixMigrator[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("migrator.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("migrator.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("migrator.router")
    .setAction(async () => {
        const result = await (await contract()).router()
        console.log(result.toString())
    })


// WRITE


subtask("migrator.migrateLiquidity")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).migrateLiquidity(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
        )
    })

subtask("migrator.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("migrator.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })


subtask("migrator.setRouter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setRouter(
            args.arg0,
        )
    })

subtask("migrator.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0,
        )
    })

subtask("migrator.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

