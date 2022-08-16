const { ethers, upgrades } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const deployReferralRegister = async (deployer) => {
    const chainId = await getChainId()
    const helixTokenAddress = contracts.helixToken[chainId]
    const feeHandlerAddress = contracts.feeHandler[chainId]
    const feeMinterAddress = contracts.feeMinter[chainId]
    const stakeRewardPercent = initials.REFERRAL_STAKE_REWARD_PERCENT[chainId]
    const swapRewardPercent = initials.REFERRAL_SWAP_REWARD_PERCENT[chainId]
    const lastMintBlock = initials.REFERRAL_LAST_MINT_BLOCK[chainId]
    const collectorPercent = initials.REFERRAL_COLLECTOR_PERCENT[chainId]

    print("deploy referral register")
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`stakeRewardPercent: ${stakeRewardPercent}`)
    print(`swapRewardPercent: ${swapRewardPercent}`)
    print(`lastMintBlock: ${lastMintBlock}`)
    print(`collectorPercent: ${collectorPercent}`)

    const ReferralRegister = await ethers.getContractFactory(`ReferralRegister`)
    ref = await upgrades.deployProxy(
        ReferralRegister, 
        [
            helixTokenAddress, 
            feeHandlerAddress,
            feeMinterAddress,
            stakeRewardPercent, 
            swapRewardPercent,
            lastMintBlock,
            collectorPercent
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
