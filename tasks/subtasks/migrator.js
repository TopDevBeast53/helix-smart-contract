const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixMigrator"
const address = contracts.helixMigrator[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// owner

// paused

// router
subtask("migrator.router")
    .setAction(async (args) => {
        const result = await (await contract()).router()
        console.log(result.toString())
    })



// WRITE


// migrateLiquidity
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

// pause

// renounceOwnership

// setRouter

// transferOwnership

// unpause
