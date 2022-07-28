const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "MultiSigWallet"
const address = contracts.devTeamMultiSig[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// adminConfirmationsRequired

// admins

// getAdmins

task("devTeamMultiSig.getBalance")
    .addPositionalParam("token")
    .setAction(async (args) => {
        const result = await (await contract()).getBalance(args.token)
        console.log(result.toString())
    })


// getOwners

task("devTeamMultiSig.getTransaction")
    .addPositionalParam("txIndex")
    .setAction(async (args) => {
        const result = await (await contract()).getTransaction(args.txIndex)
        console.log(result.toString())
    })

task("devTeamMultiSig.getTransactionCount")
    .setAction(async () => {
        const result = await (await contract()).getTransactionCount()
        console.log(result.toString())
    })


// isAdmin

task("devTeamMultiSig.isConfirmed")
    .addPositionalParam("uint256")
    .addPositionalParam("address")
    .setAction(async (args) => {
        const result = await (await contract()).isConfirmed(args.uint256, args.address)
        console.log(result.toString())
    })

// isOwner

// ownerConfirmationsRequired

// owners

// transactions


// WRITE


// _addAdmin

// _addOwner

// _removeAdmin

// _removeOwner

// _setAdminConfirmationsRequired

// _setOwnerConfirmationsRequired

// _transfer

task("devTeamMultiSig.confirmTransaction")
    .addPositionalParam("txIndex")
    .setAction(async (args) => {
        const result = await (await contract()).confirmTransaction(args.txIndex)
    })

task("devTeamMultiSig.executeTransaction")
    .addPositionalParam("txIndex")
    .setAction(async (args) => {
        const result = await (await contract()).executeTransaction(args.txIndex)
    })


// revokeConfirmation

// submitAddAdmin

// submitAddOwner

// submitRemoveAdmin

// submitRemoveOwner

// submitSetAdminConfirmationsRequired

// submitSetOwnerConfirmationsRequired

task("devTeamMultiSig.submitTransaction")
    .addPositionalParam("to")
    .addPositionalParam("value")
    .addPositionalParam("data")
    .setAction(async (args) => {
        const result = await (await contract()).submitTransaction(
            args.to,
            args.value,
            args.data
        )
    })

task("devTeamMultiSig.submitTransfer")
    .addPositionalParam("token")
    .addPositionalParam("to")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).submitTransfer(
            args.token,
            args.to,
            args.amount
        )
    })
