const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const deployHelixNftBridge = async (deployer) => {
    const chainId = await getChainId()
    const helixNftAddress = contracts.helixNFT[chainId]
    const adminAddress = initials.BRIDGE_ADMIN_ADDRESS[chainId]
    const fee_eth = initials.BRIDGE_FEE_ETH_AMOUNT[chainId]
    const limitWrap = initials.BRIDGE_LIMIT_WRAP[chainId]

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
