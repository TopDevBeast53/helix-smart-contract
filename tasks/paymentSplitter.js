const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "PaymentSplitter"
const address = contracts.paymentSplitter[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// owner

task("paymentSplitter.payee")
    .addPositionalParam("index")
    .setAction(async (args) => {
        const result = await (await contract()).payee(args.index)
        console.log(result.toString())
    })

task("paymentSplitter.releaseableErc20")
    .addPositionalParam("account")
    .setAction(async (args) => {
        const result = await (await contract()).releasableErc20(args.account)
        console.log(result.toString())
    })

// releaseableEther

// releasedErc20

// releasedEther

task("paymentSplitter.shares")
    .addPositionalParam("account")
    .setAction(async (args) => {
        const result = await (await contract()).shares(args.account)
        console.log(result.toString())
    })

// totalReleasedErc20

// totalReleasedEther

task("paymentSplitter.totalShares")
    .setAction(async () => {
        const result = await (await contract()).totalShares()
        console.log(result.toString())
    })



// WRITE


// releaseAllErc20
task("paymentSplitter.releaseAllErc20")
    .addPositionalParam("token")
    .setAction(async (args) => {
        const result = await (await contract()).releaseAllErc20(args.token)
    })


// releaseAllEther

task("paymentSplitter.releaseErc20")
    .addPositionalParam("token")
    .addPositionalParam("account")
    .setAction(async (args) => {
        const result = await (await contract()).releaseErc20(args.token, args.account)
    })

// releaseEther

// renounceOwnership

// reset

// transferOwnership

