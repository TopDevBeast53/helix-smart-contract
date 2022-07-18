const { ethers } = require("hardhat")
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const initials = require("../../constants/initials")

const helixTokenAddress = contracts.helixToken[env.network]
const withdrawPhaseDuration = initials.ADVISOR_REWARDS_WITHDRAW_PHASE_DURATION[env.network]

const deployAdvisorRewards = async (deployer) => {
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
