const { run } = require("hardhat")
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const advisorRewardsAddress = contracts.advisorRewards[env.network]

const helixTokenAddress = contracts.helixToken[env.network]
const withdrawPhaseDuration = initials.ADVISOR_REWARDS_WITHDRAW_PHASE_DURATION[env.network]

const verifyAdvisorRewards = async () => {
    print("verify advisor rewards")
    print(`helix token address: ${helixTokenAddress}`)
    print(`withdraw phase duration: ${withdrawPhaseDuration}`)

    await run(
        "verify:verify", {
            address: advisorRewardsAddress,
            constructorArguments: [
                helixTokenAddress,
                withdrawPhaseDuration 
            ]
        }
    )
}

module.exports = { verifyAdvisorRewards }
