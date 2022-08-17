const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { setSwapRewards } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')

const initializeRouter = async (wallet) => {
    const chainId = await getChainId()
    const swapRewardsAddress = contracts.swapRewards[chainId]
    const routerAddress = contracts.router[chainId]

    print("initialize the router contract")
    const router = await loadContract(routerAddress, wallet)
    await setSwapRewards(router, swapRewardsAddress)
}

module.exports = { initializeRouter }
