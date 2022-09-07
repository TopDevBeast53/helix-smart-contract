const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "MultiSigWallet"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.treasuryMultiSig[await chainId()]
    }
)


// READ


subtask("treasuryMultiSig.adminConfirmationsRequired")
    .setAction(async () => {
        const result = await (await contract()).adminConfirmationsRequired()
        console.log(result.toString())
    })

subtask("treasuryMultiSig.admins")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).admins(args.arg0)
        console.log(result.toString())
    })

subtask("treasuryMultiSig.getAdmins")
    .setAction(async () => {
        const result = await (await contract()).getAdmins()
        console.log(result.toString())
    })


subtask("treasuryMultiSig.getBalance")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBalance(args.arg0)
        console.log(result.toString())
    })

subtask("treasuryMultiSig.getOwners")
    .setAction(async () => {
        const result = await (await contract()).getOwners()
        console.log(result.toString())
    })

subtask("treasuryMultiSig.getTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getTransaction(args.arg0)
        for (let i = 0; i < result.length; i++) {
            console.log(result[i].toString())
        }
    })

subtask("treasuryMultiSig.getTransactionCount")
    .setAction(async () => {
        const result = await (await contract()).getTransactionCount()
        console.log(result.toString())
    })

subtask("treasuryMultiSig.isAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isAdmin(args.arg0)
        console.log(result.toString())
    })

subtask("treasuryMultiSig.isConfirmed")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).isConfirmed(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("treasuryMultiSig.isOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isOwner(args.arg0)
        console.log(result.toString())
    })

subtask("treasuryMultiSig.ownerConfirmationsRequired")
    .setAction(async () => {
        const result = await (await contract()).ownerConfirmationsRequired()
        console.log(result.toString())
    })

subtask("treasuryMultiSig.owners")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).owners(args.arg0)
        console.log(result.toString())
    })

subtask("treasuryMultiSig.transactions")
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

subtask("treasuryMultiSig.confirmTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).confirmTransaction(args.arg0)
    })

subtask("treasuryMultiSig.executeTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).executeTransaction(args.arg0)
    })

subtask("treasuryMultiSig.revokeConfirmation")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).revokeConfirmation(args.arg0)
    })

subtask("treasuryMultiSig.submitAddAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitAddAdmin(args.arg0)
    })

subtask("treasuryMultiSig.submitAddOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitAddOwner(args.arg0)
    })

subtask("treasuryMultiSig.submitRemoveAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitRemoveAdmin(arg0)
    })

subtask("treasuryMultiSig.submitRemoveOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitRemoveOwner(args.arg0)
    })

subtask("treasuryMultiSig.submitSetAdminConfirmationsRequired")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitSetAdminConfirmationsRequired(args.arg0)
    })

subtask("treasuryMultiSig.submitSetOwnerConfirmationsRequired")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitSetOwnerConfirmationsRequired(args.arg0)
    })

subtask("treasuryMultiSig.submitTransaction")
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

subtask("treasuryMultiSig.submitTransfer")
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
