const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const oracleFactoryAddress = contracts.oracleFactoryImplementation[env.network]

const verifyOracleFactory = async () => {
    print("verify oracle factory")

    await run(
        "verify:verify", {
            address: oracleFactoryAddress,
        }
    )
}

module.exports = { verifyOracleFactory } 
