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

// checkpoints

// decimals

subtask("helixToken.delegates")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).delegates(args.arg0)
        console.log(result.toString())
    })

// getCurrentVotes

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

// getPriorVotes

subtask("helixToken.isMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isMinter(args.arg0)
        console.log(result.toString())
    })

// maxSupply
subtask("helixToken.maxSupply")
    .setAction(async () => {
        const result = await (await contract()).maxSupply()
        console.log(result.toString())
    })

// name

// nonces

// numCheckpoints

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

// burn

// decreaseAllowance

// delMinter

// delegate

// delegateBySig

// increaseAllowance

subtask("helixToken.mint")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).mint(args.arg0, args.arg1)
    })

// renounce ownership

// transfer
subtask("helixToken.transfer")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).transfer(args.arg0, args.arg1)
    })

// transferFrom

// transferOwnership



