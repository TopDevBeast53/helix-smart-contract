const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { addRecorder } = require("../../shared/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]

const initializeReferralRegister = async (wallet) => {
    print("initialize the referral register contract")
    const referralRegister = await loadContract(referralRegisterAddress, wallet)
    await addRecorder(referralRegister, swapRewardsAddress)
    await addRecorder(referralRegister, masterChefAddress)
}

module.exports = { initializeReferralRegister }
