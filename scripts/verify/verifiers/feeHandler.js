const { run } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyFeeHandler = async () => {
    const chainId = await getChainId()
    const feeHandlerAddress = contracts.feeHandlerImplementation[chainId]

    print(`verify FeeHandler Proxy and Implementation`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    await run(
        "verify:verify", {
            address: feeHandlerAddress,
        }
    )
}

module.exports = { verifyFeeHandler }
