const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const addresses = require("../../constants/addresses")
const initials = require("../../constants/initials")

const masterChefAddress = contracts.masterChef[env.network]

const helixTokenAddress = contracts.helixToken[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const developerAddress = addresses.masterChefDeveloper[env.network]
const startBlock = initials.MASTERCHEF_START_BLOCK[env.network]
const stakingPercent = initials.MASTERCHEF_STAKING_PERCENT[env.network]
const devPercent = initials.MASTERCHEF_DEV_PERCENT[env.network]

const verifyMasterChef = async () => {
    print(`verify Master Chef`)
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`referralRegisterAddress: ${referralRegisterAddress}`)
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`developerAddress: ${developerAddress}`)
    print(`startBlock: ${startBlock}`)
    print(`stakingPercent: ${stakingPercent}`)
    print(`devPercent: ${devPercent}`)

    await run(
        "verify:verify", {
            address: masterChefAddress,
            constructorAddress: [
                helixTokenAddress,
                developerAddress,
                feeMinterAddress,
                startBlock,
                stakingPercent,
                devPercent,
                referralRegisterAddress
            ]
        }
    )
}

module.exports = { verifyMasterChef }
