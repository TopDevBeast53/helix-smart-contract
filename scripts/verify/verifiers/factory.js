const { run } = require("hardhat")
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const factoryAddress = contracts.factoryImplementation[env.network]

const verifyFactory = async () => {
    print(`verify HelixFactory Proxy and Implementation`)

    await run(
        "verify:verify", {
            address: factoryAddress,
        }
    )
}

module.exports = { verifyFactory } 
