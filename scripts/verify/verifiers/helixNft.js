const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyHelixNft = async () => {
    const chainId = await getChainId()
    const helixNftAddress = contracts.helixNFTImplementation[chainId]

    print(`verify upgradeable Helix NFT`)
    print(`helixNftAddress: ${helixNftAddress}`)

    await run(
        "verify:verify", {
            address: helixNftAddress
        }
    )
}

module.exports = { verifyHelixNft } 
