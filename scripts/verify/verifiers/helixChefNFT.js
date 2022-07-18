const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const env = require("../../../constants/env")

const helixChefNftAddress = contracts.helixChefNFTImplementation[env.network]

const verifyHelixChefNft = async () => {
    print(`verify Upgradeable Helix Chef Nft`)

    await run(
        "verify:verify", {
            address: helixChefNftAddress,
        }
    )
}

module.exports = { verifyHelixChefNft } 
