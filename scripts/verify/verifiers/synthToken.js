const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifySynthToken = async () => {
    const chainId = await getChainId()
    const synthTokenAddress = contracts.synthToken[chainId]

    print("verify synth token")
    print(`synthTokenAddress: ${synthTokenAddress}`)
    await run(
        "verify:verify", {
            address: synthTokenAddress,
            constructorArguments: []
        }
    )
}

module.exports = { verifySynthToken }
