const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "FeeMinter"
const address = contracts.feeMinter[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


task("feeMinter.decimals")
    .setAction(async () => {
        const result = await (await contract()).decimals()
        console.log(result.toString())
    })

task("feeMinter.getMinters")
    .setAction(async () => {
        const result = await (await contract()).getMinters()
        for (let i = 0; i < result.length; i++) {
            console.log(result[i])
        }
    })

task("feeMinter.getToMintPerBlock")
    .addPositionalParam("minter")
    .setAction(async (args) => {
        const result = await (await contract()).getToMintPerBlock(args.minter)
        console.log(result.toString())
    })

task("feeMinter.getToMintPercent")
    .addPositionalParam("minter")
    .setAction(async (args) => {
        const result = await (await contract()).getToMintPercent(args.minter)
        console.log(result.toString())
    })

task("feeMinter.minters")
    .addPositionalParam("index")
    .setAction(async (args) => {
        const result = await (await contract()).minters(args.index)
        console.log(result.toString())
    })

task("feeMinter.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

task("feeMinter.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })

task("feeMinter.totalToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).totalToMintPerBlock()
        console.log(result.toString())
    })



// WRITE


// renounceOwnership

// renounceTimelockOwnership

task("feeMinter.setDecimals")
    .addPositionalParam("decimals")
    .setAction(async (args) => {
        const result = await (await contract()).setDecimals(args.decimals)
    })

task("feeMinter.setToMintPercents")
    .addPositionalParam("minters")
    .addPositionalParam("toMintPercents")
    .setAction(async (args) => {
        const result = await (await contract()).setToMintPercents(
            args.minters, args.toMintPercents
        )
    })

task("feeMinter.setTotalToMintPerBlock")
    .addPositionalParam("totalToMintPerBlock")
    .setAction(async (args) => {
        const result = await (await contract()).setTotalToMintPerBlock(args.totalToMintPerBlock)
    })

// transferOwnership

// transferTimelockOwnership

