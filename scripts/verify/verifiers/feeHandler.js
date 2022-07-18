const { run } = require("hardhat")
const { print } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const env = require("../../../constants/env")

const feeHandlerAddress = contracts.feeHandlerImplementation[env.network]

const verifyFeeHandler = async () => {
    print(`verify FeeHandler Proxy and Implementation`)
    await run(
        "verify:verify", {
            address: feeHandlerAddress,
        }
    )
}

module.exports = { verifyFeeHandler }
