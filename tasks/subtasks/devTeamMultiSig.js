const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "MultiSigWallet"
const address= contracts.devTeamMultiSig[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// adminConfirmationsRequired

// admins

// getAdmins

subtask("devTeamMultiSig.getBalance")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBalance(args.arg0)
        console.log(result.toString())
    })


// getOwners

subtask("devTeamMultiSig.getTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getTransaction(args.arg0)
        for (let i = 0; i < result.length; i++) {
            console.log(result[i].toString())
        }
    })

subtask("devTeamMultiSig.getTransactionCount")
    .setAction(async () => {
        const result = await (await contract()).getTransactionCount()
        console.log(result.toString())
    })


// isAdmin

subtask("devTeamMultiSig.isConfirmed")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).isConfirmed(args.arg0, args.arg1)
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

subtask("devTeamMultiSig.confirmTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).confirmTransaction(args.arg0)
    })

subtask("devTeamMultiSig.executeTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).executeTransaction(args.arg0)
    })


// revokeConfirmation

// submitAddAdmin

// submitAddOwner

// submitRemoveAdmin

// submitRemoveOwner

// submitSetAdminConfirmationsRequired

// submitSetOwnerConfirmationsRequired

subtask("devTeamMultiSig.submitTransaction")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).submitTransaction(
            args.arg0,
            args.arg1,
            args.arg2
        )
    })

subtask("devTeamMultiSig.submitTransfer")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).submitTransfer(
            args.arg0,
            args.arg1,
            args.arg2
        )
    })
