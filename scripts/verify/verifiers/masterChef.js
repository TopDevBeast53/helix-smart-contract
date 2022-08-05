const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const masterChefAddress = contracts.masterChefImplementation[env.network]

const verifyMasterChef = async () => {
    print(`verify Master Chef`)
    print(`masterChefAddress: ${masterChefAddress}`)

    await run(
        "verify:verify", {
            address: masterChefAddress,
        }
    )
}

module.exports = { verifyMasterChef }
