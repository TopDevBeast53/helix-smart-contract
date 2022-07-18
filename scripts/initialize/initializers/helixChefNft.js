const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { addAccruer } = require("../../shared/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const helixChefNftAddress = contracts.helixChefNFT[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]

const initializeHelixChefNft = async (wallet) => {
    print("initialize the helix chef nft contract")
    const helixChefNft = await loadContract(helixChefNftAddress, wallet)
    await addAccruer(helixChefNft, feeHandlerAddress)
}

module.exports = { initializeHelixChefNft }
