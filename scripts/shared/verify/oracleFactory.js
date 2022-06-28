const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require('../../constants/env')
const contracts = require('../../constants/contracts')

const oracleFactoryAddress = contracts.oracleFactory[env.network]

const factoryAddress = contracts.factory[env.network]

const verifyOracleFactory = async () => {
    print("verify oracle factory")
    print(`factoryAddress: ${factoryAddress}`)

    await run(
        "verify:verify", {
            address: oracleFactoryAddress,
            constructorArguments: [
                factoryAddress
            ]
        }
    )
}

module.exports = { verifyOracleFactory } 
