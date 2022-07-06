const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setSwapRewards } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const swapRewardsAddress = contracts.swapRewards[env.network]
const routerAddress = contracts.router[env.network]

const initializeRouter = async (wallet) => {
    print("initialize the router contract")
    const router = await loadContract(routerAddress, wallet)
    await setSwapRewards(router, swapRewardsAddress)
}

module.exports = { initializeRouter }
