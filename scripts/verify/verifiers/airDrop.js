const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require('../../../constants/initials')

const airDropAddress = contracts.airDrop[env.network]

const tokenAddress = initials.AIRDROP_TOKEN[env.network]               // HELIX / tokenB
const withdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[env.network]

const verifyAirDrop = async () => {
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
