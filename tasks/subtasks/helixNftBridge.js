const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixNFTBridge"
const address = contracts.helixNFTBridge[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("helixNftBridge.admin")
    .setAction(async () => {
        const result = await (await contract()).admin()
        console.log(result.toString())
    })

subtask("helixNftBridge.bridgeFactories")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).bridgeFactories(args.arg0)
        console.log(result.toString())
    })

subtask("helixNftBridge.bridgeFactoryIDs")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).bridgeFactoryIDs(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("helixNftBridge.bridgeFactoryLastId")
    .setAction(async () => {
        const result = await (await contract()).bridgeFactoryLastId()
        console.log(result.toString())
    })

subtask("helixNftBridge.compareStringsbyBytes")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).compareStringsbyBytes(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("helixNftBridge.gasFeeToAdmin")
    .setAction(async () => {
        const result = await (await contract()).gasFeeToAdmin()
        console.log(result.toString())
    })

subtask("helixNftBridge.getBridgeFactories")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBridgeFactories(args.arg0)
        console.log(result.toString())
    })

subtask("helixNftBridge.getBridgeFactoryIDs")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBridgeFactoryIDs(args.arg0)
        console.log(result.toString())
    })

subtask("helixNftBridge.getBridger")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBridger(args.arg0)
        console.log(result.toString())
    })

subtask("helixNftBridge.getBridgersLength")
    .setAction(async () => {
        const result = await (await contract()).getBridgersLength()
        console.log(result.toString())
    })

subtask("helixNftBridge.getCreatedFactoryIdByUser")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getCreatedFactoryIdByUser(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("helixNftBridge.getGasFeeToAdmin")
    .setAction(async () => {
        const result = await (await contract()).getGasFeeToAdmin()
        console.log(result.toString())
    })

subtask("helixNftBridge.getNftIDsByFactoryID")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getNftIDsByFactoryID(args.arg0)
        console.log(result.toString())
    })

subtask("helixNftBridge.isBridger")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isBridger(args.arg0)
        console.log(result.toString())
    })

subtask("helixNftBridge.limitWrapPerFactory")
    .setAction(async () => {
        const result = await (await contract()).limitWrapPerFactory()
        console.log(result.toString())
    })

subtask("helixNftBridge.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("helixNftBridge.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })


// WRITE


subtask("helixNftBridge.addBridgeFactory")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).addBridgeFactory(
            args.arg0,
            args.arg1,
        )
    })

subtask("helixNftBridge.bridgeToEthereum")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).bridgeToEthereum(args.arg0)
    })

subtask("helixNftBridge.bridgeToSolana")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).bridgeToSolana(
            args.arg0,
            args.arg1,
        )
    })

subtask("helixNftBridge.delBridger")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).delBridger(args.arg0)
    })

subtask("helixNftBridge.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("helixNftBridge.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("helixNftBridge.setAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setAdmin(args.arg0)
    })

subtask("helixNftBridge.setGasFeeToAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setGasFeeToAdmin(args.arg0)
    })

subtask("helixNftBridge.setHelixNFT")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setHelixNFT(args.arg0)
    })

subtask("helixNftBridge.setLimitWrapPerFactory")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setLimitWrapPerFactory(args.arg0)
    })

subtask("helixNftBridge.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(args.arg0)
    })

subtask("helixNftBridge.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

subtask("helixNftBridge.wrap")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).wrap(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
        )
    })

