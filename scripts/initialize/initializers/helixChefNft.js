const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { addAccruer } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const initializeHelixChefNft = async (wallet) => {
    const chainId = await getChainId()
    const helixChefNftAddress = contracts.helixChefNFT[chainId]
    const feeHandlerAddress = contracts.feeHandler[chainId]

    print("initialize the helix chef nft contract")
    const helixChefNft = await loadContract(helixChefNftAddress, wallet)
    await addAccruer(helixChefNft, feeHandlerAddress)
}

module.exports = { initializeHelixChefNft }
