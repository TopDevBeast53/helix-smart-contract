const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const initials = require("../../constants/initials")

const helixNftAddress = contracts.helixNFT[env.network]
const adminAddress = initials.BRIDGE_ADMIN_ADDRESS[env.network]

const deployHelixNftBridge = async (deployer) => {
    print("deploy helix nft bridge")
    print(`helixNftAddress: ${helixNftAddress}`)
    print(`adminAddress: ${adminAddress}`)

    // const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    // const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    // nonce = await network.provider.send(`eth_getTransactionCount`, [admin.address, "latest"]);

    const HelixNftBridge = await ethers.getContractFactory(`HelixNFTBridge`)
    bridge = await HelixNftBridge.deploy(
       helixNftAddress, 
       adminAddress
    )
    await bridge.deployTransaction.wait()
    print(`HelixNftBridge deployed to ${bridge.address}`)
}

module.exports = { deployHelixNftBridge } 
