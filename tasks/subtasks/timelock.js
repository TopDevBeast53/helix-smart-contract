const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "TimelockController"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.timelock[await chainId()]
    }
)


// READ


subtask("timelock.CANCELLOR_ROLE")
    .setAction(async () => {
        const result = await (await contract()).CANCELLOR_ROLE()
        console.log(result.toString())
    })

subtask("timelock.DEFAULT_ADMIN_ROLE")
    .setAction(async () => {
        const result = await (await contract()).DEFAULT_ADMIN_ROLE()
        console.log(result.toString())
    })

subtask("timelock.EXECUTOR_ROLE")
    .setAction(async () => {
        const result = await (await contract()).EXECUTOR_ROLE()
        console.log(result.toString())
    })

subtask("timelock.PROPOSER_ROLE")
    .setAction(async () => {
        const result = await (await contract()).PROPOSER_ROLE()
        console.log(result.toString())
    })

subtask("timelock.TIMELOCK_ADMIN_ROLE")
    .setAction(async () => {
        const result = await (await contract()).TIMELOCK_ADMIN_ROLE()
        console.log(result.toString())
    })

subtask("timelock.getMinDelay")
    .setAction(async () => {
        const result = await (await contract()).getMinDelay()
        console.log(result.toString())
    })

subtask("timelock.getRoleAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getRoleAdmin(args.arg0)
        console.log(result.toString())
    })

subtask("timelock.getTimestamp")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getTimestamp(args.arg0)
        console.log(result.toString())
    })

/*
subtask("timelock.supportsInterface")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).supportsInterface(args.arg0, args.arg1)
        console.log(result.toString())
    })
*/

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

subtask("timelock.hashOperationBatch")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).hashOperationBatch(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4
        )
        console.log(result.toString())
    })

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

subtask("timelock.supportsInterface")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).supportsInterface(args.arg0)
        console.log(result.toString())
    })



// WRITE


subtask("timelock.cancel")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).cancel(args.arg0)
    })

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

subtask("timelock.executeBatch")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).executeBatch(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })

subtask("timelock.grantRole")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).grantRole(args.arg0, args.arg1)
    })

subtask("timelock.onERC1155BatchReceived")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).onERC1155BatchReceived(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4
        )
    })

subtask("timelock.onERC1155Received")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).onERC1155Received(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4
        )
    })

subtask("timelock.onERC721Received")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .setAction(async (args) => {
        const result = await (await contract()).onERC721Received(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3
        )
    })

subtask("timelock.renounceRole")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).renounceRole(args.arg0, args.arg1)
    })

subtask("timelock.schedule")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).schedule(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })

subtask("timelock.scheduleBatch")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).scheduleBatch(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5
        )
    })

subtask("timelock.updateDelay")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).updateDelay(args.arg0)
    })
