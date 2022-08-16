const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyMasterChef = async () => {
    const chainId = await getChainId() 
    const masterChefAddress = contracts.masterChefImplementation[chainId]

    print(`verify Master Chef`)
    print(`masterChefAddress: ${masterChefAddress}`)

    await run(
        "verify:verify", {
            address: masterChefAddress,
        }
    )
}

module.exports = { verifyMasterChef }
