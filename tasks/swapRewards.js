const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "SwapRewards"
const address = contracts.swapRewards[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// helixToken

// oracleFactory

// owner
task("helixToken.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })


// paused

// refReg

// router


// WRITE


// pause

// renounceOwnership

// setHelixToken

// setOracleFactory

// setRefReg

// setRouter

// swap
task("helixToken.swap")
    .addPositionalParam("user")
    .addPositionalParam("tokenIn")
    .addPositionalParam("amountIn")
    .setAction(async (args) => {
        const result = await (await contract()).swap(args.user, args.tokenIn, args.amountIn)
    })

// transferOwnership

// unpause
