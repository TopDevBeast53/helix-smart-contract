const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')

const verifySynthReactor = async (verifyer) => {
    const chainId = await getChainId()
    const synthReactorAddress = contracts.synthReactorImplementation[chainId]

    print(`verify Synth Reactor`);
    print(`synthReactorAddress: ${synthReactorAddress}`)

    await run(
        "verify:verify", {
            address: synthReactorAddress,
        }
    )     
}

module.exports = { verifySynthReactor }
