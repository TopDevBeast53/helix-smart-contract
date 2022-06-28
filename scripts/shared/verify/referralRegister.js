const { run } = require(`hardhat`)
const { print } = require("../utilities")

const contracts = require("../../constants/contracts")
const initials = require("../../constants/initials")
const env = require("../../constants/env")

const referralRegisterAddress = contracts.referralRegister[env.network]

const helixTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const stakeRewardPercent = initials.REFERRAL_STAKE_REWARD_PERCENT[env.network]
const swapRewardPercent = initials.REFERRAL_SWAP_REWARD_PERCENT[env.network]
const lastMintBlock = initials.REFERRAL_LAST_MINT_BLOCK[env.network]

const verifyReferralRegister = async () => {
    print("verify referral register")
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`stakeRewardPercent: ${stakeRewardPercent}`)
    print(`swapRewardPercent: ${swapRewardPercent}`)
    print(`lastMintBlock: ${lastMintBlock}`)

    await run(
        "verify:verify", {
            address: referralRegisterAddress,
            constructorArguments: [
                helixTokenAddress, 
                feeHandlerAddress,
                feeMinterAddress,
                stakeRewardPercent, 
                swapRewardPercent,
                lastMintBlock
            ]
        }
    )
}

module.exports = { verifyReferralRegister }
