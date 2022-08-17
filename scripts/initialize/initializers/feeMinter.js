const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { setToMintPercents } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const initializeFeeMinter = async (wallet) => {
    const chainId = await getChainId()

    const feeMinterAddress = contracts.feeMinter[chainId]

    const minters = initials.FEE_MINTER_MINTERS[chainId]
    const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[chainId]

    print("initialize the feeMinter contract")
    const feeMinter = await loadContract(feeMinterAddress, wallet)
    await setToMintPercents(feeMinter, minters, toMintPercents)
}

module.exports = { initializeFeeMinter }
