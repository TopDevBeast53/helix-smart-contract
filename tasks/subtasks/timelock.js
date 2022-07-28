const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "TimelockController"
const address = contracts.timelock[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// CANCELLOR_ROLE

// DEFAULT_ADMIN_ROLE

// EXECUTOR_ROLE

// PROPOSER_ROLE

// TIMELOCK_ADMIN_ROLE

// getMinDelay

// getRoleAdmin

// getTimestamp

// hasRole

subtask("timelock.hashOperation")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).hashOperation(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4
        )
        console.log(result.toString())
    })

// hashOperationBatch

subtask("timelock.isOperation")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isOperation(args.arg0)
        console.log(result.toString())
    })

subtask("timelock.isOperationDone")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isOperationDone(args.arg0)
        console.log(result.toString())
    })

subtask("timelock.isOperationPending")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isOperationPending(args.arg0)
        console.log(result.toString())
    })

subtask("timelock.isOperationReady")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isOperationReady(args.arg0)
        console.log(result.toString())
    })


// supportsInterface


// WRITE


// cancel

subtask("timelock.execute")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).execute(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })


// executeBatch

// grantRole

// onERC1155BatchReceived

// onERC1155Received

// onERC721Received

// renounceRole

// schedule
subtask("timelock.schedule")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).execute(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })


// scheduleBatch

// updateDelay
