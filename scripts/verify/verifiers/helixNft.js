const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const helixNftAddress = contracts.helixNFTImplementation[env.network]

const verifyHelixNft = async () => {
    print(`verify upgradeable Helix NFT`)
    print(`helixNftAddress: ${helixNftAddress}`)

    await run(
        "verify:verify", {
            address: helixNftAddress
        }
    )
}

module.exports = { verifyHelixNft } 
