const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const multicallAddress = contracts.multicall[env.network]

const verifyMulticall = async () => {
    print("verify multicall")
    print(`multicallAddress: ${multicallAddress}`)

    await run(
        "verify:verify", {
            address: multicallAddress
        }
    )
}

module.exports = { verifyMulticall } 
