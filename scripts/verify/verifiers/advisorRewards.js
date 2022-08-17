const { run } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const verifyAdvisorRewards = async () => {
    const chainId = await getChainId()
    const advisorRewardsAddress = contracts.advisorRewards[chainId]
    const helixTokenAddress = contracts.helixToken[chainId]
    const withdrawPhaseDuration = initials.ADVISOR_REWARDS_WITHDRAW_PHASE_DURATION[chainId]

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
