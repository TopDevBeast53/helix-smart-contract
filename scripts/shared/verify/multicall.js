const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const multicallAddress = contracts.multicall[env.network]

const verifyMulticall = async () => {
    print("verify multicall")

    await run(
        "verify:verify", {
            address: multicallAddress
        }
    )
}

module.exports = { verifyMulticall } 
