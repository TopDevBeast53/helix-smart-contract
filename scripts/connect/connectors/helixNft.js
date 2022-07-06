const { ethers } = require(`hardhat`)
const { print, loadContract, getContractName } = require("../../shared/utilities")
const { addMinter, addStaker } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const helixChefNftAddress = contracts.helixChefNFT[env.network]
const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]
const helixNftAddress = contracts.helixNFT[env.network]

const connectHelixNft = async (wallet) => {
    const helixNft = await loadContract(helixNftAddress, wallet)
    await addMinter(helixNft, helixNftBridgeAddress)
    await addStaker(helixNft, helixChefNftAddress)
}
module.exports = { connectHelixNft }
