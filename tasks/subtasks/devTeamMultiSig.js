const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "MultiSigWallet"
const address= contracts.devTeamMultiSig[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("devTeamMultiSig.adminConfirmationsRequired")
    .setAction(async () => {
        const result = await (await contract()).adminConfirmationsRequied()
        console.log(result.toString())
    })

subtask("devTeamMultiSig.admins")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).admins(args.arg0)
        console.log(result.toString())
    })

subtask("devTeamMultiSig.getAdmins")
    .setAction(async () => {
        const result = await (await contract()).getAdmins()
        console.log(result.toString())
    })


subtask("devTeamMultiSig.getBalance")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBalance(args.arg0)
        console.log(result.toString())
    })

subtask("devTeamMultiSig.getOwners")
    .setAction(async () => {
        const result = await (await contract()).getOwners()
        console.log(result.toString())
    })

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

subtask("devTeamMultiSig.isAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isAdmin(args.arg0)
        console.log(result.toString())
    })

subtask("devTeamMultiSig.isConfirmed")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).isConfirmed(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("devTeamMultiSig.isOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isOwner(args.arg0)
        console.log(result.toString())
    })

subtask("devTeamMultiSig.ownerConfirmationsRequired")
    .setAction(async () => {
        const result = await (await contract()).ownerConfirmationsRequired()
        console.log(result.toString())
    })

subtask("devTeamMultiSig.owners")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).owners(args.arg0)
        console.log(result.toString())
    })

subtask("devTeamMultiSig.transactions")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transactions(args.arg0)
        console.log(result.toString())
    })



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

subtask("devTeamMultiSig.revokeConfirmation")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).revokeConfirmation(args.arg0)
    })

subtask("devTeamMultiSig.submitAddAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitAddAdmin(args.arg0)
    })

subtask("devTeamMultiSig.submitAddOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitAddOwner(args.arg0)
    })

subtask("devTeamMultiSig.submitRemoveAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitRemoveAdmin(arg0)
    })

subtask("devTeamMultiSig.submitRemoveOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitRemoveOwner(args.arg0)
    })

subtask("devTeamMultiSig.submitSetAdminConfirmationsRequired")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitSetAdminConfirmationsRequired(args.arg0)
    })

subtask("devTeamMultiSig.submitSetOwnerConfirmationsRequired")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitSetOwnerConfirmationsRequired(args.arg0)
    })

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
