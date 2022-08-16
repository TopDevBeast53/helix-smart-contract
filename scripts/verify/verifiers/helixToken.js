const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyHelixToken = async () => {
    const chainId = await getChainId()
    const helixTokenAddress = contracts.helixToken[chainId]

    print("verify helix token")
    print(`helixTokenAddress: ${helixTokenAddress}`)
    await run(
        "verify:verify", {
            address: helixTokenAddress,
            constructorArguments: []
        }
    )
}

module.exports = { verifyHelixToken }
