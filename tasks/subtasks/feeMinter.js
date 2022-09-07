const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "FeeMinter"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.feeMinter[await chainId()]
    }
)


// READ


subtask("feeMinter.decimals")
    .setAction(async () => {
        const result = await (await contract()).decimals()
        console.log(result.toString())
    })

subtask("feeMinter.getMinters")
    .setAction(async () => {
        const result = await (await contract()).getMinters()
        for (let i = 0; i < result.length; i++) {
            console.log(result[i])
        }
    })

subtask("feeMinter.getToMintPerBlock")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getToMintPerBlock(args.arg0)
        console.log(result.toString())
    })

subtask("feeMinter.getToMintPercent")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getToMintPercent(args.arg0)
        console.log(result.toString())
    })

subtask("feeMinter.minters")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).minters(args.arg0)
        console.log(result.toString())
    })

subtask("feeMinter.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("feeMinter.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })

subtask("feeMinter.totalToMintPerBlock")
    .setAction(async () => {
        const result = await (await contract()).totalToMintPerBlock()
        console.log(result.toString())
    })



// WRITE


subtask("feeMinter.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("feeMinter.renounceTimelockOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceTimelockOwnership()
    })

subtask("feeMinter.setDecimals")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setDecimals(args.arg0)
    })

subtask("feeMinter.setToMintPercents")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setToMintPercents(
            args.arg0.split(","), args.arg1.split(",")
        )
    })

subtask("feeMinter.setTotalToMintPerBlock")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setTotalToMintPerBlock(args.arg0)
    })

subtask("feeMinter.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(args.arg0)
    })

subtask("feeMinter.transferTimelockOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferTimelockOwnership(args.arg0)
    })
