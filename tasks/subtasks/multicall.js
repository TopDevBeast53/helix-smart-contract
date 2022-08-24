const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "Multicall2"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.multicall[await chainId()]
    }
)


// READ


subtask("multicall.getBlockHash")
    .setAction(async () => {
        const result = await (await contract()).getBlockHash()
        console.log(result.toString())
    })

subtask("multicall.getBlockNumber")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBlockNumber(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("multicall.getCurrentBlockCoinbase")
    .setAction(async () => {
        const result = await (await contract()).getCurrentBlockCoinbase()
        console.log(result.toString())
    })

subtask("multicall.getCurrentBlockDifficulty")
    .setAction(async () => {
        const result = await (await contract()).getCurrentBlockDifficulty()
        console.log(result.toString())
    })

subtask("multicall.getCurrentBlockGasLimit")
    .setAction(async () => {
        const result = await (await contract()).getCurrentBlockGasLimit()
        console.log(result.toString())
    })

subtask("multicall.getCurrentBlockTimestamp")
    .setAction(async () => {
        const result = await (await contract()).getCurrentBlockTimestamp()
        console.log(result.toString())
    })

subtask("multicall.getEthBalance")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getEthBalance(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("multicall.getLastBlockHash")
    .setAction(async () => {
        const result = await (await contract()).getLastBlockHash()
        console.log(result.toString())
    })



// WRITE


subtask("multicall.aggregate")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).aggregate(
            args.arg0,
        )
    })

subtask("multicall.blockAndAggregate")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).blockAndAggregate(
            args.arg0,
        )
    })

subtask("multicall.tryAggregate")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).tryAggregate(
            args.arg0,
            args.arg1,
        )
    })

subtask("multicall.tryBlockAndAggregate")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).tryBlockAndAggregate(
            args.arg0,
            args.arg1,
        )
    })

