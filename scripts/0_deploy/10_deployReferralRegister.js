/**
 * deploy Referral Register
 *
 * run from root: 
 *      npx hardhat run scripts/deploy/10_deployReferralRegister.js --network ropsten
 */

const { ethers, upgrades } = require(`hardhat`)
const contracts = require("../constants/contracts")
const initials = require("../constants/initials")
const env = require("../constants/env")

const helixTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const stakeRewardPercent = initials.REFERRAL_STAKE_REWARD_PERCENT[env.network]
const swapRewardPercent = initials.REFERRAL_SWAP_REWARD_PERCENT[env.network]
const lastMintBlock = initials.REFERRAL_LAST_MINT_BLOCK[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)

    console.log(`helixTokenAddress ${helixTokenAddress}`)
    console.log(`feeHandlerAddress ${feeHandlerAddress}`)
    console.log(`feeMinterAddress ${feeMinterAddress}`)
    console.log(`stakeRewardPercent ${stakeRewardPercent}`)
    console.log(`swapRewardPercent ${swapRewardPercent}`)
    console.log(`lastMintBlock ${lastMintBlock}`)

    console.log(`------ Start deploying Referral Register contract ---------`)
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
    console.log(`Referral Register deployed to ${ref.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        ref.address
    )
    console.log(`Implementation address: ${implementationAddress}`)

    console.log('done')
}

 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error)
         process.exit(1)
     }) 
