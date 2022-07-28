const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "OracleFactory"
const address = contracts.oracleFactory[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// canUpdate
subtask("oracleFactory.canUpdate")
    .setAction(async () => {
        const result = await (await contract()).canUpdate()
        console.log(result.toString())
    })

// consult
subtask("oracleFactory.consult")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).consult(args.arg0, args.arg1, args.arg2)
        console.log(result.toString())
    })

// factory

// getOracle

// oracleExists

// oracles

// owner

// period


// WRITE


// create

// initialize

// renounceOwnership

// setPeriod

// transferOwnership

// update

