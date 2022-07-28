const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixFactory"
const address = contracts.factory[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("factory.INIT_CODE_HASH")
    .setAction(async () => {
        const result = await (await contract()).INIT_CODE_HASH()
        console.log(result.toString())
    })

subtask("factory.allPairs")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).allPairs(args.arg0)
        console.log(result.toString())
    })

subtask("factory.allPairsLength")
    .setAction(async () => {
        const result = await (await contract()).allPairsLength()
        console.log(result.toString())
    })


// defaultSwapFee

// feeTo

// feeToSetter

subtask("factory.getPair")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getPair(args.arg0, args.arg1)
        console.log(result.toString())
    })


// oracleFactory


// WRITE


subtask("factory.createPair")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).createPair(args.arg0, args.arg1)
        console.log(result.toString())
    })

// initialize

// setDefaultSwapFee

// setDevFee

// setFeeTo

// setFeeToSetter

// setOracleFactory

// setSwapFee

// updateOracle


