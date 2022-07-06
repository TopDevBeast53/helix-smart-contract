const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setReferralRegister, add } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]

const lpTokenAddresses = initials.MASTERCHEF_LPTOKEN_ADDRESSES[env.network]
const allocPoints = initials.MASTERCHEF_ALLOC_POINTS[env.network]

const initializeMasterChef = async (wallet) => {
    print("initialize the master chef contract")
    const masterChef = await loadContract(masterChefAddress, wallet)

    await setReferralRegister(masterChef, referralRegisterAddress)

    await add(masterChef, lpTokenAddresses[0], allocPoints[0], false)
    await add(masterChef, lpTokenAddresses[1], allocPoints[1], false)
    await add(masterChef, lpTokenAddresses[2], allocPoints[2], false)
    await add(masterChef, lpTokenAddresses[3], allocPoints[3], false)
    await add(masterChef, lpTokenAddresses[4], allocPoints[4], false)

}

module.exports = { initializeMasterChef }
