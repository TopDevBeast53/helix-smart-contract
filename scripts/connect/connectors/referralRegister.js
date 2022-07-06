const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { addRecorder } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]

const connectReferralRegister = async (wallet) => {
    const referralRegister = await loadContract(
        referralRegisterAddress,
        wallet
    )
    await addRecorder(referralRegister, swapRewardsAddress)
    await addRecorder(referralRegister, masterChefAddress)
}

module.exports = { connectReferralRegister }
