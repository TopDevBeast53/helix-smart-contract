const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setToMintPercents } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const feeMinterAddress = contracts.feeMinter[env.network]

const minters = initials.FEE_MINTER_MINTERS[env.network]
const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

const initFeeMinter = async (wallet) => {
    print(`(re)initialize the feeMinter to it's default state`)
    const feeMinter = await loadContract(feeMinterAddress, wallet)
    await setToMintPercents(feeMinter, minters, toMintPercents)
}

module.exports = { initFeeMinter }
