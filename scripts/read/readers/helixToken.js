const { ethers } = require("hardhat")
const { print, loadContract, getContractName } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const helixTokenAddress = contracts.helixToken[env.network]

const DELEGATION_TYPEHASH = async (wallet) => {
    const helixToken = await loadContract(helixTokenAddress, wallet)
    return await helixToken.DELEGATION_TYPEHASH()
}

const DOMAIN_TYPEHASH = async (wallet) => {
    const helixToken = await loadContract(helixTokenAddress, wallet)
    return await helixToken.DOMAIN_TYPEHASH()
}

// allowance
const allowance = async (wallet, owner, spender) => {
    const helixToken = await loadContract(helixTokenAddress, wallet)
    return await helixToken.allowance(owner, spender)
}

// balanceOf

// checkpoints

// decimals

// delegates

// getCurrentVotes

// getMinter

// getMinterLength

// getOwner

// getPriorVotes

// isMinter

// maxSupply

// name

// nonces

// numCheckpoints

// owner

// preMineSupply

// symbol

// totalSupply

module.exports = {
    DELEGATION_TYPEHASH,
    DOMAIN_TYPEHASH,
    allowance,
}
