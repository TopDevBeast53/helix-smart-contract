const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const addresses = require("../../constants/addresses")

const autoHelixAddress = contracts.autoHelix[env.network]

const helixTokenAddress = contracts.helixToken[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const treasuryAddress = addresses.TREASURY[env.network]

const verifyAutoHelix = async () => {
    print("verify auto helix")
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`masterChefAddress: ${masterChefAddress}`)
    print(`treasuryAddress: ${treasuryAddress}`)

    await run(
        "verify:verify", {
            address: autoHelixAddress,
            constructorArguments: [
                helixTokenAddress,
                masterChefAddress,
                treasuryAddress
            ]
        }
    )
}

module.exports = { verifyAutoHelix }
