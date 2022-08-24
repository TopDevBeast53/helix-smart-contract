const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "MultiSigWallet"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.ownerMultiSig[await chainId()]
    }
)


// READ


subtask("ownerMultiSig.adminConfirmationsRequired")
    .setAction(async () => {
        const result = await (await contract()).adminConfirmationsRequired()
        console.log(result.toString())
    })

subtask("ownerMultiSig.admins")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).admins(args.arg0)
        console.log(result.toString())
    })

subtask("ownerMultiSig.getAdmins")
    .setAction(async () => {
        const result = await (await contract()).getAdmins()
        console.log(result.toString())
    })


subtask("ownerMultiSig.getBalance")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBalance(args.arg0)
        console.log(result.toString())
    })

subtask("ownerMultiSig.getOwners")
    .setAction(async () => {
        const result = await (await contract()).getOwners()
        console.log(result.toString())
    })

subtask("ownerMultiSig.getTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getTransaction(args.arg0)
        for (let i = 0; i < result.length; i++) {
            console.log(result[i].toString())
        }
    })

subtask("ownerMultiSig.getTransactionCount")
    .setAction(async () => {
        const result = await (await contract()).getTransactionCount()
        console.log(result.toString())
    })

subtask("ownerMultiSig.isAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isAdmin(args.arg0)
        console.log(result.toString())
    })

subtask("ownerMultiSig.isConfirmed")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).isConfirmed(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("ownerMultiSig.isOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isOwner(args.arg0)
        console.log(result.toString())
    })

subtask("ownerMultiSig.ownerConfirmationsRequired")
    .setAction(async () => {
        const result = await (await contract()).ownerConfirmationsRequired()
        console.log(result.toString())
    })

subtask("ownerMultiSig.owners")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).owners(args.arg0)
        console.log(result.toString())
    })

subtask("ownerMultiSig.transactions")
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

subtask("ownerMultiSig.confirmTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).confirmTransaction(args.arg0)
    })

subtask("ownerMultiSig.executeTransaction")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).executeTransaction(args.arg0)
    })

subtask("ownerMultiSig.revokeConfirmation")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).revokeConfirmation(args.arg0)
    })

subtask("ownerMultiSig.submitAddAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitAddAdmin(args.arg0)
    })

subtask("ownerMultiSig.submitAddOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitAddOwner(args.arg0)
    })

subtask("ownerMultiSig.submitRemoveAdmin")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitRemoveAdmin(arg0)
    })

subtask("ownerMultiSig.submitRemoveOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitRemoveOwner(args.arg0)
    })

subtask("ownerMultiSig.submitSetAdminConfirmationsRequired")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitSetAdminConfirmationsRequired(args.arg0)
    })

subtask("ownerMultiSig.submitSetOwnerConfirmationsRequired")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).submitSetOwnerConfirmationsRequired(args.arg0)
    })

subtask("ownerMultiSig.submitTransaction")
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

subtask("ownerMultiSig.submitTransfer")
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
