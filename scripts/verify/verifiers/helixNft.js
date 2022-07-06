const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const helixNftAddress = contracts.helixNFTImplementation[env.network]

const verifyHelixNft = async () => {
    print(`verify upgradeable Helix NFT`)

    await run(
        "verify:verify", {
            address: helixNftAddress
        }
    )
}

module.exports = { verifyHelixNft } 
