const { run } = require(`hardhat`)
const { print } = require("../utilities")

const contracts = require("../../constants/contracts")
const env = require("../../constants/env")

const helixChefNftAddress = contracts.helixChefNFT[env.network]

const rewardToken = contracts.helixToken[env.network];
const helixNftAddress = contracts.helixNFT[env.network];

const verifyHelixChefNft = async () => {
    print(`verify Upgradeable Helix Chef Nft`)
    print(`rewardToken: ${rewardToken}`)
    print(`helixNftAddress: ${helixNftAddress}`)

    await run(
        "verify:verify", {
            address: helixChefNftAddress,
            constructorArguments: [
                helixNftAddress,
                rewardToken
            ]
        }
    )
}

module.exports = { verifyHelixChefNft } 
