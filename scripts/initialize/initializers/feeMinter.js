const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setToMintPercents } = require("../../shared/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const feeMinterAddress = contracts.feeMinter[env.network]

const minters = initials.FEE_MINTER_MINTERS[env.network]
const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

const initializeFeeMinter = async (wallet) => {
    print("initialize the feeMinter contract")
    const feeMinter = await loadContract(feeMinterAddress, wallet)
    await setToMintPercents(feeMinter, minters, toMintPercents)
}

module.exports = { initializeFeeMinter }
