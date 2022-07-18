const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]

const helixNftAddress = contracts.helixNFT[env.network]
const adminAddress = initials.BRIDGE_ADMIN_ADDRESS[env.network]
const gasFeeEth = initials.BRIDGE_FEE_ETH_AMOUNT[env.network]
const limitWrap = initials.BRIDGE_LIMIT_WRAP[env.network]

const verifyHelixNftBridge = async () => {
    print("verify helix nft bridge")
    print(`helixNftAddress: ${helixNftAddress}`)
    print(`adminAddress: ${adminAddress}`)
    print(`gasFeeEth: ${gasFeeEth}`)
    print(`limitWrapPerFactory: ${limitWrap}`)

    await run(
        "verify:verify", {
            address: helixNftBridgeAddress,
            constructorArguments: [
                helixNftAddress,
                adminAddress,
                gasFeeEth,
                limitWrap
            ]
        }
    )
}

module.exports = { verifyHelixNftBridge } 

