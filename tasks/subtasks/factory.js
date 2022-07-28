const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixFactory"
const address = contracts.factory[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("factory.INIT_CODE_HASH")
    .setAction(async () => {
        const result = await (await contract()).INIT_CODE_HASH()
        console.log(result.toString())
    })

subtask("factory.allPairs")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).allPairs(args.arg0)
        console.log(result.toString())
    })

subtask("factory.allPairsLength")
    .setAction(async () => {
        const result = await (await contract()).allPairsLength()
        console.log(result.toString())
    })

subtask("factory.defaultSwapFee")
    .setAction(async () => {
        const result = await (await contract()).defaultSwapFee()
        console.log(result.toString())
    })

subtask("factory.feeTo")
    .setAction(async () => {
        const result = await (await contract()).feeTo()
        console.log(result.toString())
    })

subtask("factory.feeToSetter")
    .setAction(async () => {
        const result = await (await contract()).feeToSetter()
        console.log(result.toString())
    })

subtask("factory.getPair")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getPair(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("factory.oracleFactory")
    .setAction(async () => {
        const result = await (await contract()).oracleFactory()
        console.log(result.toString())
    })



// WRITE


subtask("factory.createPair")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).createPair(args.arg0, args.arg1)
    })

subtask("factory.initialize")
    .setAction(async () => {
        const result = await (await contract()).initialize()
    })

subtask("factory.setDefaultSwapFee")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setDefaultSwapFee(
            args.arg0
        )
    })

subtask("factory.setDevFee")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setDevFee(
            args.arg0,
            args.arg1
        )
    })

subtask("factory.setFeeTo")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeTo(
            args.arg0
        )
    })

subtask("factory.setFeeToSetter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setFeeToSetter(
            args.arg0
        )
    })

subtask("factory.setOracleFactory")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setOracleFactory(
            args.arg0
        )
    })

subtask("factory.setSwapFee")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setSwapFee(
            args.arg0,
            args.arg1
        )
    })

subtask("factory.updateOracle")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).updateOracle(
            args.arg0,
            args.arg1
        )
    })
 
