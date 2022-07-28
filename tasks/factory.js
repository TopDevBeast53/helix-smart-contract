const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "HelixFactory"
const address = contracts.factory[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


task("helixToken.INIT_CODE_HASH")
    .setAction(async () => {
        const result = await (await contract()).INIT_CODE_HASH()
        console.log(result.toString())
    })

task("helixToken.allPairs")
    .addPositionalParam("uint256")
    .setAction(async (args) => {
        const result = await (await contract()).allPairs(args.uint256)
        console.log(result.toString())
    })

task("helixToken.allPairsLength")
    .setAction(async () => {
        const result = await (await contract()).allPairsLength()
        console.log(result.toString())
    })


// defaultSwapFee

// feeTo

// feeToSetter

task("helixToken.getPair")
    .addPositionalParam("tokenA")
    .addPositionalParam("tokenB")
    .setAction(async (args) => {
        const result = await (await contract()).getPair(args.tokenA, args.tokenB)
        console.log(result.toString())
    })


// oracleFactory


// WRITE


task("helixToken.createPair")
    .addPositionalParam("tokenA")
    .addPositionalParam("tokenB")
    .setAction(async (args) => {
        const result = await (await contract()).createPair(args.tokenA, args.tokenB)
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


