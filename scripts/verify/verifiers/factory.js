const { run } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyFactory = async () => {
    const chainId = await getChainId()
    const factoryAddress = contracts.factoryImplementation[chainId]

    print(`verify HelixFactory Proxy and Implementation`)
    print(`factoryAddress: ${factoryAddress}`)

    await run(
        "verify:verify", {
            address: factoryAddress,
        }
    )
}

module.exports = { verifyFactory } 
