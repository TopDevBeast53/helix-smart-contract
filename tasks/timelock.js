const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

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

task("timelock.hashOperation")
    .addPositionalParam("target")
    .addPositionalParam("value")
    .addPositionalParam("data")
    .addPositionalParam("predecessor")
    .addPositionalParam("salt")
    .setAction(async (args) => {
        const result = await (await contract()).hashOperation(
            args.target,
            args.value,
            args.data,
            args.predecessor,
            args.salt
        )
        console.log(result.toString())
    })

// hashOperationBatch

task("timelock.isOperation")
    .addPositionalParam("id")
    .setAction(async (args) => {
        const result = await (await contract()).isOperation(args.id)
        console.log(result.toString())
    })

task("timelock.isOperationDone")
    .addPositionalParam("id")
    .setAction(async (args) => {
        const result = await (await contract()).isOperationDone(args.id)
        console.log(result.toString())
    })

task("timelock.isOperationPending")
    .addPositionalParam("id")
    .setAction(async (args) => {
        const result = await (await contract()).isOperationPending(args.id)
        console.log(result.toString())
    })

task("timelock.isOperationReady")
    .addPositionalParam("id")
    .setAction(async (args) => {
        const result = await (await contract()).isOperationReady(args.id)
        console.log(result.toString())
    })


// supportsInterface


// WRITE


// cancel

task("timelock.execute")
    .addPositionalParam("execute")
    .addPositionalParam("target")
    .addPositionalParam("value")
    .addPositionalParam("payload")
    .addPositionalParam("predecessor")
    .addPositionalParam("salt")
    .setAction(async (args) => {
        const result = await (await contract()).execute(
            args.execute,
            args.target,
            args.value,
            args.payload,
            args.predecessor,
            args.salt
        )
    })


// executeBatch

// grantRole

// onERC1155BatchReceived

// onERC1155Received

// onERC721Received

// renounceRole

// schedule
task("timelock.schedule")
    .addPositionalParam("target")
    .addPositionalParam("value")
    .addPositionalParam("data")
    .addPositionalParam("predecessor")
    .addPositionalParam("salt")
    .addPositionalParam("delay")
    .setAction(async (args) => {
        const result = await (await contract()).execute(
            args.target,
            args.value,
            args.data,
            args.predecessor,
            args.salt,
            args.delay
        )
    })


// scheduleBatch

// updateDelay
