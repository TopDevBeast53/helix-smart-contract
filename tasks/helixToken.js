const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "HelixToken"
const address = contracts.helixToken[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


task("helixToken.DELEGATION_TYPEHASH")
    .setAction(async () => {
        const result = await (await contract()).DELEGATION_TYPEHASH()
        console.log(result.toString())
    })

task("helixToken.DOMAIN_TYPEHASH")
    .setAction(async () => {
        const result = await (await contract()).DOMAIN_TYPEHASH()
        console.log(result.toString())
    })

task("helixToken.allowance")
    .addPositionalParam("owner")
    .addPositionalParam("spender")
    .setAction(async (args) => {
        const result = await (await contract()).allowance(args.owner, args.spender)
        console.log(result.toString())
    })

task("helixToken.balanceOf")
    .addPositionalParam("account")
    .setAction(async (args) => {
        const result = await (await contract()).balanceOf(args.account)
        console.log(result.toString())
    })

// checkpoints

// decimals

task("helixToken.delegates")
    .addPositionalParam("delegator")
    .setAction(async (args) => {
        const result = await (await contract()).delegates(args.delegator)
        console.log(result.toString())
    })

// getCurrentVotes

task("helixToken.getMinter")
    .addPositionalParam("index")
    .setAction(async (args) => {
        const result = await (await contract()).getMinter(args.index)
        console.log(result.toString())
    })

task("helixToken.getMinterLength")
    .setAction(async () => {
        const result = await (await contract()).getMinterLength()
        console.log(result.toString())
    })

task("helixToken.getOwner")
    .setAction(async () => {
        const result = await (await contract()).getOwner()
        console.log(result.toString())
    })

// getPriorVotes

task("helixToken.isMinter")
    .addPositionalParam("account")
    .setAction(async (args) => {
        const result = await (await contract()).isMinter(args.account)
        console.log(result.toString())
    })

// maxSupply
task("helixToken.maxSupply")
    .setAction(async () => {
        const result = await (await contract()).maxSupply()
        console.log(result.toString())
    })

// name

// nonces

// numCheckpoints

task("helixToken.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

task("helixToken.preMineSupply")
    .setAction(async () => {
        const result = await (await contract()).preMineSupply()
        console.log(result.toString())
    })

task("helixToken.symbol")
    .setAction(async () => {
        const result = await (await contract()).symbol()
        console.log(result.toString())
    })

task("helixToken.totalSupply")
    .setAction(async () => {
        const result = await (await contract()).totalSupply()
        console.log(result.toString())
    })


// WRITE


task("helixToken.addMinter")
    .addPositionalParam("addMinter")
    .setAction(async (args) => {
        const result = await (await contract()).addMinter(args.addMinter)
    })

task("helixToken.approve")
    .addPositionalParam("spender")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).approve(args.spender, args.amount)
    })

// burn

// decreaseAllowance

// delMinter

// delegate

// delegateBySig

// increaseAllowance

task("helixToken.mint")
    .addPositionalParam("to")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).mint(args.to, args.amount)
    })

// renounce ownership

// transfer
task("helixToken.transfer")
    .addPositionalParam("recipient")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const result = await (await contract()).transfer(args.recipient, args.amount)
    })



// transferFrom

// transferOwnership



