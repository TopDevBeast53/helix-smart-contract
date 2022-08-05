const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const autoHelixAddress = contracts.autoHelixImplementation[env.network]

const verifyAutoHelix = async () => {
    print("verify auto helix")
    print(`autoHelixAddress: ${autoHelixAddress}`)

    await run(
        "verify:verify", {
            address: autoHelixAddress,
        }
    )
}

module.exports = { verifyAutoHelix }
