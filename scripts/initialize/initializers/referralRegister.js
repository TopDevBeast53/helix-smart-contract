const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { addRecorder } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')

const initializeReferralRegister = async (wallet) => {
    const chainId = await getChainId()
    const masterChefAddress = contracts.masterChef[chainId]
    const referralRegisterAddress = contracts.referralRegister[chainId]
    const swapRewardsAddress = contracts.swapRewards[chainId]

    print("initialize the referral register contract")
    const referralRegister = await loadContract(referralRegisterAddress, wallet)
    await addRecorder(referralRegister, swapRewardsAddress)
    await addRecorder(referralRegister, masterChefAddress)
}

module.exports = { initializeReferralRegister }
