const { run } = require("hardhat")
const { print } = require("../utilities")

const env = require("../../constants/env")
const initials = require("../../constants/initials")
const contracts = require("../../constants/contracts")

const feeMinterAddress = contracts.feeMinter[env.network]

const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.network]

const verifyFeeMinter = async () => {
    print("verify fee minter");
    print(`total to mint per block: ${totalToMintPerBlock}`)

    await run(
        "verify:verify", {
            address: feeMinterAddress,
            constructorArguments: [totalToMintPerBlock]
        }
    )
}

module.exports = { verifyFeeMinter }
