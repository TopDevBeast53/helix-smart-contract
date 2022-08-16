const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyAutoHelix = async () => {
    const chainId = await getChainId()
    const autoHelixAddress = contracts.autoHelixImplementation[chainId]

    print("verify auto helix")
    print(`autoHelixAddress: ${autoHelixAddress}`)

    await run(
        "verify:verify", {
            address: autoHelixAddress,
        }
    )
}

module.exports = { verifyAutoHelix }
