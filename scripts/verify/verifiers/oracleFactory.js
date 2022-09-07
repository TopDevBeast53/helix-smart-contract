const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')

const verifyOracleFactory = async () => {
    const chainId = await getChainId()
    const oracleFactoryAddress = contracts.oracleFactoryImplementation[chainId]

    print("verify oracle factory")
    print(`oracleFactoryAddress: ${oracleFactoryAddress}`)

    await run(
        "verify:verify", {
            address: oracleFactoryAddress,
        }
    )
}

module.exports = { verifyOracleFactory } 
