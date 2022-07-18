const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require('../../../constants/initials')

const airDropAddress = contracts.airDrop[env.network]

const tokenAddress = initials.AIRDROP_TOKEN[env.network]               // HELIX / tokenB
const name = initials.AIRDROP_NAME[env.network]
const withdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[env.network]

// Define contract settings
const initialBalance = initials.AIRDROP_INITIAL_BALANCE[env.network]

const verifyAirDrop = async () => {
    print(`verify Air Drop`)
    print(`tokenAddress: ${tokenAddress}`)
    print(`name: ${name}`)
    print(`withdrawPhaseDuration: ${withdrawPhaseDuration}`)

    await run(
        "verify:verify", {
            address: airDropAddress,
            constructorArguments: [
                name,
                tokenAddress,
                withdrawPhaseDuration
            ]
        }
    )     
}

module.exports = { verifyAirDrop } 
