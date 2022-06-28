const { ethers, upgrades } = require(`hardhat`)
const { print } = require("../utilities")

const contracts = require("../../constants/contracts")
const initials = require("../../constants/initials")
const env = require("../../constants/env")

const helixTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const stakeRewardPercent = initials.REFERRAL_STAKE_REWARD_PERCENT[env.network]
const swapRewardPercent = initials.REFERRAL_SWAP_REWARD_PERCENT[env.network]
const lastMintBlock = initials.REFERRAL_LAST_MINT_BLOCK[env.network]

const deployReferralRegister = async (deployer) => {
    print("deploy referral register")
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`stakeRewardPercent: ${stakeRewardPercent}`)
    print(`swapRewardPercent: ${swapRewardPercent}`)
    print(`lastMintBlock: ${lastMintBlock}`)

    const ReferralRegister = await ethers.getContractFactory(`ReferralRegister`)
    ref = await upgrades.deployProxy(
        ReferralRegister, 
        [
            helixTokenAddress, 
            feeHandlerAddress,
            feeMinterAddress,
            stakeRewardPercent, 
            swapRewardPercent,
            lastMintBlock
        ]
    )
    await ref.deployTransaction.wait()
    print(`Referral Register deployed to ${ref.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        ref.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployReferralRegister }
