/**
 * @dev Referral Register Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/6_deployReferralRegister.js --network rinkeby
 * 
 */
const { ethers, upgrades } = require(`hardhat`)
const contracts = require("./constants/contracts")
const initials = require("./constants/initials")
const env = require("./constants/env")

const helixTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const stakeRewardPercent = initials.REFERRAL_STAKE_REWARD_PERCENT[env.network]
const swapRewardPercent = initials.REFERRAL_SWAP_REWARD_PERCENT[env.network]
const toMintPerBlock = initials.REFERRAL_TO_MINT_PER_BLOCK[env.network]
const lastMintBlock = initials.REFERRAL_LAST_MINT_BLOCK[env.network]

async function main() {

    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)

    console.log(`------ Start deploying Referral Register contract ---------`)
    const ReferralRegister = await ethers.getContractFactory(`ReferralRegister`)
    ref = await upgrades.deployProxy(
        ReferralRegister, 
        [
            helixTokenAddress, 
            feeHandlerAddress,
            stakeRewardPercent, 
            swapRewardPercent,
            toMintPerBlock,
            lastMintBlock
        ]
    )
    await ref.deployTransaction.wait()
    console.log(`Referral Register deployed to ${ref.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        ref.address
    )
    console.log(`Implementation address: ${implementationAddress}`)

    console.log(`------ Add Referral Register as Minter to HelixToken ---------`)
    const HelixToken = await ethers.getContractFactory(`HelixToken`)
    const helixToken = HelixToken.attach(helixTokenAddress)

    let tx = await helixToken.addMinter(ref.address)
    await tx.wait()
    console.log(`Success to add Minter to HelixToken`)
}

 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error)
         process.exit(1)
     }) 
