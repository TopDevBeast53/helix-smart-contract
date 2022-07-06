const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const initials = require("../../constants/initials")

const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]

const helixNftAddress = contracts.helixNFT[env.network]
const adminAddress = initials.BRIDGE_ADMIN_ADDRESS[env.network]

const verifyHelixNftBridge = async () => {
    print("verify helix nft bridge")
    print(`helixNftAddress: ${helixNftAddress}`)
    print(`adminAddress: ${adminAddress}`)

    await run(
        "verify:verify", {
            address: helixNftBridgeAddress,
            constructorArguments: [
                helixNftAddress,
                adminAddress
            ]
        }
    )
}

module.exports = { verifyHelixNftBridge } 
