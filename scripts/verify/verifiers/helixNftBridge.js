const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const verifyHelixNftBridge = async () => {
    const chainId = await getChainId()
    const helixNftBridgeAddress = contracts.helixNFTBridge[chainId]
    const helixNftAddress = contracts.helixNFT[chainId]
    const adminAddress = initials.BRIDGE_ADMIN_ADDRESS[chainId]
    const gasFeeEth = initials.BRIDGE_FEE_ETH_AMOUNT[chainId]
    const limitWrap = initials.BRIDGE_LIMIT_WRAP[chainId]

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

