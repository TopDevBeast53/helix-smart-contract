const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const helixTokenAddress = contracts.helixToken[env.network]

const verifyHelixToken = async () => {
    print("verify helix token")
    await run(
        "verify:verify", {
            address: helixTokenAddress,
            constructorArguments: []
        }
    )
}

module.exports = { verifyHelixToken }
