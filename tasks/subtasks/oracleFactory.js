const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "OracleFactory"
const address = contracts.oracleFactory[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("oracleFactory.canUpdate")
    .setAction(async () => {
        const result = await (await contract()).canUpdate()
        console.log(result.toString())
    })

subtask("oracleFactory.consult")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).consult(
            args.arg0, 
            args.arg1, 
            args.arg2
        )
        console.log(result.toString())
    })

subtask("oracleFactory.factory")
    .setAction(async () => {
        const result = await (await contract()).factory()
        console.log(result.toString())
    })

subtask("oracleFactory.getOracle")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getOracle(
            args.arg0, 
            args.arg1
        )
        console.log(result.toString())
    })

subtask("oracleFactory.oracleExists")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).oracleExists(
            args.arg0, 
            args.arg1
        )
        console.log(result.toString())
    })

subtask("oracleFactory.oracles")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).oracles(
            args.arg0, 
            args.arg1
        )
        console.log(result.toString())
    })

subtask("oracleFactory.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("oracleFactory.period")
    .setAction(async () => {
        const result = await (await contract()).period()
        console.log(result.toString())
    })



// WRITE


subtask("oracleFactory.create")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).create(
            args.arg0, 
            args.arg1
        )
    })

subtask("oracleFactory.initialize")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(
            args.arg0
        )
    })

subtask("oracleFactory.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("oracleFactory.setPeriod")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setPeriod(
            args.arg0
        )
    })

subtask("oracleFactory.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0
        )
    })

subtask("oracleFactory.update")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).update(
            args.arg0,
            args.arg1
        )
    })

