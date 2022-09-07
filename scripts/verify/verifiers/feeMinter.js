const { run } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const verifyFeeMinter = async () => {
    const chainId = await getChainId()
    const feeMinterAddress = contracts.feeMinter[chainId]
    const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[chainId]

    print("verify fee minter");
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`total to mint per block: ${totalToMintPerBlock}`)

    await run(
        "verify:verify", {
            address: feeMinterAddress,
            constructorArguments: [totalToMintPerBlock]
        }
    )
}

module.exports = { verifyFeeMinter }
