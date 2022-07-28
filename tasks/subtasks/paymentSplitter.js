const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "PaymentSplitter"
const address = contracts.paymentSplitter[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("paymentSplitter.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("paymentSplitter.payee")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).payee(args.arg0)
        console.log(result.toString())
    })

subtask("paymentSplitter.releaseableErc20")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).releasableErc20(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("paymentSplitter.releaseableEther")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).releaseableEther(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("paymentSplitter.releasedErc20")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).releasedErc20(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("paymentSplitter.releasedEther")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).releasedEther(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("paymentSplitter.shares")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).shares(args.arg0)
        console.log(result.toString())
    })

subtask("paymentSplitter.totalReleasedErc20")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).totalReleasedErc20(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("paymentSplitter.totalReleasedEther")
    .setAction(async () => {
        const result = await (await contract()).totalReleasedEther()
        console.log(result.toString())
    })


subtask("paymentSplitter.totalShares")
    .setAction(async () => {
        const result = await (await contract()).totalShares()
        console.log(result.toString())
    })


// WRITE


subtask("paymentSplitter.releaseAllErc20")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).releaseAllErc20(args.arg0)
    })

subtask("paymentSplitter.releaseAllEther")
    .setAction(async () => {
        const result = await (await contract()).releaseAllEther()
    })

subtask("paymentSplitter.releaseErc20")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).releaseErc20(
            args.arg0, 
            args.arg1
        )
    })

subtask("paymentSplitter.releaseEther")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).releaseEther(
            args.arg0, 
        )
    })

subtask("paymentSplitter.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("paymentSplitter.reset")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).reset(
            args.arg0, 
            args.arg1
        )
    })

subtask("paymentSplitter.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0, 
        )
    })

