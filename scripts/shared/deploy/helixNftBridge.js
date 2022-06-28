const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const helixNftAddress = contracts.helixNFT[env.network]
const adminAddress = "0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57"

const deployHelixNftBridge = async (deployer) => {
    print("deploy helix nft bridge")
    print(`helixNftAddress: ${helixNftAddress}`)
    print(`adminAddress: ${adminAddress}`)

    /*
    const HelixNftBridge = await ethers.getContractFactory(`HelixNftBridge`)
    bridge = await HelixNftBridge.deploy(
       helixNftAddress, 
       adminAddress
    )
    await bridge.deployTransaction.wait()
    print(`HelixNftBridge deployed to ${bridge.address}`)
    */
}

module.exports = { deployHelixNftBridge } 
