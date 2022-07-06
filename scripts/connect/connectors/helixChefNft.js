const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { addAccruer } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const helixChefNftAddress = contracts.helixChefNFT[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]

const connectHelixChefNft = async (wallet) => {
    const helixChefNft = await loadContract(helixChefNftAddress, wallet)
    await addAccruer(helixChefNft, feeHandlerAddress)
}

module.exports = { connectHelixChefNft }
