const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const initials = require("../../constants/initials")

const helixNftAddress = contracts.helixNFT[env.network]
const adminAddress = initials.BRIDGE_ADMIN_ADDRESS[env.network]
const fee_eth = initials.BRIDGE_FEE_ETH_AMOUNT[env.network]
const limitWrap = initials.BRIDGE_LIMIT_WRAP[env.network]

const deployHelixNftBridge = async (deployer) => {
    print("deploy helix nft bridge")
    print(`helixNftAddress: ${helixNftAddress}`)
    print(`adminAddress: ${adminAddress}`)
    print(`fee_eth: ${fee_eth}`)
    print(`limitWrapPerFactory: ${limitWrap}`)

    const HelixNftBridge = await ethers.getContractFactory(`HelixNFTBridge`)
    bridge = await HelixNftBridge.deploy(
       helixNftAddress, 
       adminAddress,
       fee_eth,
       limitWrap
    )
    await bridge.deployTransaction.wait()
    print(`HelixNftBridge deployed to ${bridge.address}`)
}

module.exports = { deployHelixNftBridge } 
