const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "HelixToken"
const address = contracts.helixToken[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


subtask("helixToken.DELEGATION_TYPEHASH")
    .setAction(async () => {
        const result = await (await contract()).DELEGATION_TYPEHASH()
        console.log(result.toString())
    })

subtask("helixToken.DOMAIN_TYPEHASH")
    .setAction(async () => {
        const result = await (await contract()).DOMAIN_TYPEHASH()
        console.log(result.toString())
    })

subtask("helixToken.allowance")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).allowance(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("helixToken.balanceOf")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).balanceOf(args.arg0)
        console.log(result.toString())
    })

subtask("helixToken.checkpoints")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).checkpoints(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("helixToken.decimals")
    .setAction(async () => {
        const result = await (await contract()).decimals()
        console.log(result.toString())
    })

subtask("helixToken.delegates")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).delegates(args.arg0)
        console.log(result.toString())
    })

subtask("helixToken.getCurrentVotes")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getCurrentVotes(args.arg0)
        console.log(result.toString())
    })

subtask("helixToken.getMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getMinter(args.arg0)
        console.log(result.toString())
    })

subtask("helixToken.getMinterLength")
    .setAction(async () => {
        const result = await (await contract()).getMinterLength()
        console.log(result.toString())
    })

subtask("helixToken.getOwner")
    .setAction(async () => {
        const result = await (await contract()).getOwner()
        console.log(result.toString())
    })

subtask("helixToken.getPriorVotes")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getPriorVotes(args.arg0, args.arg1)
        console.log(result.toString())
    })

subtask("helixToken.isMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isMinter(args.arg0)
        console.log(result.toString())
    })

subtask("helixToken.maxSupply")
    .setAction(async () => {
        const result = await (await contract()).maxSupply()
        console.log(result.toString())
    })

subtask("helixToken.name")
    .setAction(async () => {
        const result = await (await contract()).name()
        console.log(result.toString())
    })

subtask("helixToken.nonces")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).nonces(args.arg0)
        console.log(result.toString())
    })

subtask("helixToken.numCheckpoints")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).numCheckpoints(args.arg0)
        console.log(result.toString())
    })

subtask("helixToken.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("helixToken.preMineSupply")
    .setAction(async () => {
        const result = await (await contract()).preMineSupply()
        console.log(result.toString())
    })

subtask("helixToken.symbol")
    .setAction(async () => {
        const result = await (await contract()).symbol()
        console.log(result.toString())
    })

subtask("helixToken.totalSupply")
    .setAction(async () => {
        const result = await (await contract()).totalSupply()
        console.log(result.toString())
    })


// WRITE


subtask("helixToken.addMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).addMinter(args.arg0)
    })

subtask("helixToken.approve")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).approve(args.arg0, args.arg1)
    })

subtask("helixToken.burn")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).burn(args.arg0, args.arg1)
    })

subtask("helixToken.decreaseAllowance")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).decreaseAllowance(args.arg0, args.arg1)
    })

subtask("helixToken.delMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).delMinter(args.arg0)
    })

subtask("helixToken.delegate")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).delegate(args.arg0)
    })

subtask("helixToken.delegateBySig")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .addPositionalParam("arg5")
    .setAction(async (args) => {
        const result = await (await contract()).delegateBySig(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
            args.arg5,
        )
    })

subtask("helixToken.increaseAllowance")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).increaseAllowance(args.arg0, args.arg1)
    })

subtask("helixToken.mint")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).mint(args.arg0, args.arg1)
    })

subtask("helixToken.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("helixToken.transfer")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).transfer(args.arg0, args.arg1)
    })

subtask("helixToken.transferFrom")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).transferFrom(
            args.arg0, 
            args.arg1,
            args.arg2
        )
    })

subtask("helixToken.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(args.arg0)
    })
