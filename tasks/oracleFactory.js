const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "OracleFactory"
const address = contracts.oracleFactory[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// canUpdate
task("oracleFactory.canUpdate")
    .setAction(async () => {
        const result = await (await contract()).canUpdate()
        console.log(result.toString())
    })

// consult
task("oracleFactory.consult")
    .addPositionalParam("tokenIn")
    .addPositionalParam("amountIn")
    .addPositionalParam("tokenOut")
    .setAction(async (args) => {
        const result = await (await contract()).consult(args.tokenIn, args.amountIn, args.tokenOut)
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

