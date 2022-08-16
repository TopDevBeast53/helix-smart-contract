const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')
const initials = require('../../../constants/initials')

const verifyAirDrop = async () => {
    const chainId = await getChainId()
    const airDropAddress = contracts.airDrop[chainId]
    const tokenAddress = initials.AIRDROP_TOKEN[chainId]               // HELIX / tokenB
    const withdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[chainId]

    print(`verify Air Drop`)
    print(`airDropAddress ${airDropAddress}`)
    print(`tokenAddress: ${tokenAddress}`)
    print(`withdrawPhaseDuration: ${withdrawPhaseDuration}`)

    await run(
        "verify:verify", {
            address: airDropAddress,
            constructorArguments: [
                tokenAddress,
                withdrawPhaseDuration
            ]
        }
    )     
}

module.exports = { verifyAirDrop } 
