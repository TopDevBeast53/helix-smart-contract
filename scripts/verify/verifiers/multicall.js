const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyMulticall = async () => {
    const chainId = await getChainId()
    const multicallAddress = contracts.multicall[chainId]

    print("verify multicall")
    print(`multicallAddress: ${multicallAddress}`)

    await run(
        "verify:verify", {
            address: multicallAddress
        }
    )
}

module.exports = { verifyMulticall } 
