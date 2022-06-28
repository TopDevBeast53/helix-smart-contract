const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const autoHelixAddress = contracts.autoHelixImplementation[env.network]

const verifyAutoHelix = async () => {
    print("verify auto helix")

    await run(
        "verify:verify", {
            address: autoHelixAddress,
        }
    )
}

module.exports = { verifyAutoHelix }
