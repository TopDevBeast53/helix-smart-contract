const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "PaymentSplitter"
const address = contracts.paymentSplitter[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// owner

subtask("paymentSplitter.payee")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).payee(args.arg0)
        console.log(result.toString())
    })

subtask("paymentSplitter.releaseableErc20")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).releasableErc20(args.arg0)
        console.log(result.toString())
    })

// releaseableEther

// releasedErc20

// releasedEther

subtask("paymentSplitter.shares")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).shares(args.arg0)
        console.log(result.toString())
    })

// totalReleasedErc20

// totalReleasedEther

subtask("paymentSplitter.totalShares")
    .setAction(async () => {
        const result = await (await contract()).totalShares()
        console.log(result.toString())
    })



// WRITE


// releaseAllErc20
subtask("paymentSplitter.releaseAllErc20")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).releaseAllErc20(args.arg0)
    })


// releaseAllEther

subtask("paymentSplitter.releaseErc20")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).releaseErc20(args.arg0, args.arg1)
    })

// releaseEther

// renounceOwnership

// reset

// transferOwnership

