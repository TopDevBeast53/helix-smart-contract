const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { addMinter, addStaker } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')

const initializeHelixNft = async (wallet) => {
    const chainId = await getChainId()
    const helixChefNftAddress = contracts.helixChefNFT[chainId]
    const helixNftBridgeAddress = contracts.helixNFTBridge[chainId]
    const helixNftAddress = contracts.helixNFT[chainId]

    print("initialize the helix nft contract")
    const helixNft = await loadContract(helixNftAddress, wallet)
    await addMinter(helixNft, helixNftBridgeAddress)
    await addStaker(helixNft, helixChefNftAddress)
}

module.exports = { initializeHelixNft }
