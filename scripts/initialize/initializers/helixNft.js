const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { addMinter, addStaker } = require("../../shared/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const helixChefNftAddress = contracts.helixChefNFT[env.network]
const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]
const helixNftAddress = contracts.helixNFT[env.network]

const initializeHelixNft = async (wallet) => {
    print("initialize the helix nft contract")
    const helixNft = await loadContract(helixNftAddress, wallet)
    await addMinter(helixNft, helixNftBridgeAddress)
    await addStaker(helixNft, helixChefNftAddress)
}
module.exports = { initializeHelixNft }
