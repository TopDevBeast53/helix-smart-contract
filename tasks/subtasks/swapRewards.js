const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "SwapRewards"
const address = contracts.swapRewards[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// helixToken

// oracleFactory

// owner
subtask("helixToken.owner")
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
subtask("helixToken.swap")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).swap(args.arg0, args.arg1, args.arg2)
    })

// transferOwnership

// unpause
