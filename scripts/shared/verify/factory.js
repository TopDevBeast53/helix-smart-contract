const { run } = require("hardhat")
const { print } = require("../utilities")

const env = require("../../constants/env")
const addresses = require("../../constants/addresses")
const contracts = require("../../constants/contracts")

const factoryAddress = contracts.factory[env.network]

const setterFeeOnPairSwaps = addresses.setterFeeOnPairSwaps[env.network]
const poolReceiveTradeFee = addresses.poolReceiveTradeFee[env.network]

const verifyFactory = async () => {
    print(`verify HelixFactory Proxy and Implementation`)
    print(`setterFeeOnPairSwaps: ${setterFeeOnPairSwaps}`)
    print(`poolReceiveTradeFee: ${poolReceiveTradeFee}`)

    await run(
        "verify:verify", {
            address: factoryAddress,
            constructorArguments: [
                setterFeeOnPairSwaps,
                poolReceiveTradeFee
            ]
        }
    )
}

module.exports = { verifyFactory } 
