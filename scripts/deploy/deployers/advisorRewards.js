const { ethers } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const deployAdvisorRewards = async (deployer) => {
    const chainId = await getChainId()
    const helixTokenAddress = contracts.helixToken[chainId]
    const withdrawPhaseDuration = initials.ADVISOR_REWARDS_WITHDRAW_PHASE_DURATION[chainId]

    print("deploy advisor rewards")
    print(`helix token address: ${helixTokenAddress}`)
    print(`withdraw phase duration: ${withdrawPhaseDuration}`)

    const advisorRewardsContractFactory = await ethers.getContractFactory("AdvisorRewards")
    const advisorRewards = await advisorRewardsContractFactory.deploy(
        helixTokenAddress, 
        withdrawPhaseDuration
    )
    await advisorRewards.deployTransaction.wait()
    print(`deployed to ${advisorRewards.address}`)
}

module.exports = { deployAdvisorRewards }
