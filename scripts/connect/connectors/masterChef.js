const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setReferralRegister } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]

const connectMasterChef = async (wallet) => {
    const masterChef = await loadContract(masterChefAddress, wallet)
    await setReferralRegister(masterChef, referralRegisterAddress)
}

module.exports = { connectMasterChef }
