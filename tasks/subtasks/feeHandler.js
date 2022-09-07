const { getChainId, loadContract } = require("./utilities")

const contracts = require("../../constants/contracts")

const name = "FeeHandler"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.feeHandler[await chainId()]
    }
)


// READ


subtask("feeHandler.defaultNftChefPercent")
    .setAction(async () => {
        const result = await (await contract()).defaultNftChefPercent()
        console.log(result.toString())
    })

subtask("feeHandler.getNftChefAndTreasuryAmounts")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getNftChefAndTreasuryAmounts(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("feeHandler.getNftChefFee")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getNftChefFee(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("feeHandler.getNftChefFeeSplit")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getNftChefSplit(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("feeHandler.hasNftChefPercent")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).hasNftChefPercent(
            args.arg0
        )
        console.log(result.toString())
    })

subtask("feeHandler.helixToken")
    .setAction(async () => {
        const result = await (await contract()).helixToken()
        console.log(result.toString())
    })

subtask("feeHandler.isFeeCollector")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isFeeCollector(
            args.arg0
        )
        console.log(result.toString())
    })

subtask("feeHandler.nftChef")
    .setAction(async () => {
        const result = await (await contract()).nftChef()
        console.log(result.toString())
    })

subtask("feeHandler.nftChefPercents")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).nftChefPercents(
            args.arg0
        )
        console.log(result.toString())
    })

subtask("feeHandler.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("feeHandler.timelockOwner")
    .setAction(async () => {
        const result = await (await contract()).timelockOwner()
        console.log(result.toString())
    })

subtask("feeHandler.treasury")
    .setAction(async () => {
        const result = await (await contract()).treasury()
        console.log(result.toString())
    })


// WRITE


subtask("feeHandler.addFeeCollector")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).addFeeCollector(
            args.arg0
        )
    })

subtask("feeHandler.initialize")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3
        )
    })

subtask("feeHandler.removeFeeCollector")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).removeFeeCollector(
            args.arg0
        )
    })

subtask("feeHandler.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("feeHandler.renounceTimelockOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceTimelockOwnership()
    })

subtask("feeHandler.setDefaultNftChefPercent")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setDefaultNftChefPercent(
            args.arg0
        )
    })

subtask("feeHandler.setNftChef")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setNftChef(
            args.arg0
        )
    })

subtask("feeHandler.setNftChefPercent")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setNftChefPercent(
            args.arg0,
            args.arg1
        )
    })

subtask("feeHandler.setTreasury")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setTreasury(
            args.arg0
        )
    })

subtask("feeHandler.transferFee")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).transferFee(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3
        )
    })

subtask("feeHandler.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0
        )
    })

subtask("feeHandler.transferTimelockOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferTimelockOwnership(
            args.arg0
        )
    })

