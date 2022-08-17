const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyHelixChefNft = async () => {
    const chainId = await getChainId()
    const helixChefNftAddress = contracts.helixChefNFTImplementation[chainId]

    print(`verify Upgradeable Helix Chef Nft`)

    await run(
        "verify:verify", {
            address: helixChefNftAddress,
        }
    )
}

module.exports = { verifyHelixChefNft } 
