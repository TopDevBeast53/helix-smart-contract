const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "LpSwap"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    {
        name: name, 
        address: contracts.lpSwap[await chainId()]
    }
)


// READ


subtask("lpSwap.swaps")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).swaps(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.bids")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).bids(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.swapIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).swapIds(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.bidIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).bidIds(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.hasBidOnSwap")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).hasBidOnSwap(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("lpSwap.bidderSwapIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).bidderSwapIds(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.getSwapIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getSwapIds(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.getBidIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBidIds(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.getBidderSwapIds")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBidderSwapIds(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.getSwaps")
    .setAction(async () => {
        const result = await (await contract()).getSwaps()
        console.log(result.toString())
    })

subtask("lpSwap.getSwap")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getSwap(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.getBid")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBid(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.getSwapId")
    .setAction(async () => {
        const result = await (await contract()).getSwapId()
        console.log(result.toString())
    })

subtask("lpSwap.getBidId")
    .setAction(async () => {
        const result = await (await contract()).getBidId()
        console.log(result.toString())
    })



// WRITE


subtask("lpSwap.initialize")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("lpSwap.openSwap")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).openSwap(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
        )
        console.log(result.toString())
    })

subtask("lpSwap.setAsk")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setAsk(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("lpSwap.closeSwap")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).closeSwap(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.makeBid")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).makeBid(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("lpSwap.setBid")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setBid(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("lpSwap.acceptBid")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).acceptBid(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.acceptAsk")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).acceptAsk(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.pause")
    .setAction(async (args) => {
        const result = await (await contract()).pause()
        console.log(result.toString())
    })

subtask("lpSwap.unpause")
    .setAction(async (args) => {
        const result = await (await contract()).unpause()
        console.log(result.toString())
    })

subtask("lpSwap.setFeeHandler")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeHandler(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("lpSwap.setCollectorPercentAndDecimals")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setCollectorPercentAndDecimals(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

