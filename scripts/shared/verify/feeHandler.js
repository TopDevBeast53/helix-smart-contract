const { run } = require("hardhat")
const { print } = require("../utilities")

const addresses = require("../../constants/addresses")
const contracts = require("../../constants/contracts")
const env = require("../../constants/env")

const feeHandlerAddress = contracts.feeHandler[env.network]

const treasuryAddress = addresses.TREASURY[env.network]
const nftChefAddress = contracts.helixChefNFT[env.network]
const helixTokenAddress = contracts.helixToken[env.network]

const verifyFeeHandler = async () => {
    print(`verify FeeHandler Proxy and Implementation`)
    print(`treasuryAddress: ${treasuryAddress}`)
    print(`nftChefAddress: ${nftChefAddress}`)
    print(`helixTokenAddress: ${helixTokenAddress}`)

    await run(
        "verify:verify", {
            address: feeHandlerAddress,
            constructorArguments: [
                treasuryAddress,
                nftChefAddress,
                helixTokenAddress
            ]
        }
    )
}

module.exports = { verifyFeeHandler }
