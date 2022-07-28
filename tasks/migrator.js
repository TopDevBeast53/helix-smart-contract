const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "HelixMigrator"
const address = contracts.helixMigrator[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// owner

// paused

// router
task("migrator.router")
    .setAction(async (args) => {
        const result = await (await contract()).router()
        console.log(result.toString())
    })



// WRITE


// migrateLiquidity
task("migrator.migrateLiquidity")
    .addPositionalParam("tokenA")
    .addPositionalParam("tokenB")
    .addPositionalParam("lpToken")
    .addPositionalParam("externalRouter")
    .setAction(async (args) => {
        const result = await (await contract()).migrateLiquidity(
            args.tokenA,
            args.tokenB,
            args.lpToken,
            args.externalRouter,
        )
    })

// pause

// renounceOwnership

// setRouter

// transferOwnership

// unpause
