/**
 *
 * @dev Swap Fee Rewards with AP Deployment
 *
 * command to deploy on bsc-testnet:
 *      `npx hardhat run scripts/11_deploySwapRewards.js --network testnetBSC`
 *
 * Workflow:
 *      0. Print the values that will be passed to the SwapRewards constructor
 *      1. Deploy the Swap Rewards contract
 *      2. Register SwapRewards with Router.
 *      3. Register the swapRewards contract with the referralRegister as a recorder.
 *      4. Register the swapRewards contract with the auraToken as a minter.
 *      5. Register swapRewards contract with the exchange's auraNFT as an accruer.
 *
 */

// Define script parameters
const { ethers } = require(`hardhat`)
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')
const env = require('./constants/env')

const overrides = {
    gasLimit: 999999
}

const verbose = true

// Define SwapRewards contract constructor arguments
const routerAddress = contracts.router[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const refRegAddress = contracts.referralRegister[env.network]

const auraTokenAddress = contracts.auraToken[env.network]
const auraNFTAddress = contracts.auraNFT[env.network]
const apTokenAddress = contracts.apToken[env.network]

const splitRewardPercent = initials.SPLIT_REWARD_PERCENT[env.network]
const auraRewardPercent = initials.AURA_REWARD_PERCENT[env.network]
const apRewardPercent = initials.AP_REWARD_PERCENT[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    print(`Deployer address: ${deployer.address}\n`)

    // Deploy the SwapRewards contract
    displayConstructorArgs()
    swapRewardsAddress = await deploySwapRewards()

    // Call setters on contracts which depend on swapRewards
    await registerWithRouter(swapRewardsAddress)
    await registerAsRecorder(swapRewardsAddress)
    await registerAsMinter(swapRewardsAddress)
    await registerAsAccruer(swapRewardsAddress)
}

// 0. Print the values that will be passed to the SwapRewards constructor
function displayConstructorArgs() {
    print(`SwapRewards constructor arguments:`)

    print(`\trouter:\t\t\t${routerAddress}`)
    print(`\toracle factory:\t\t${oracleFactoryAddress}`)
    print(`\trefReg:\t\t\t${refRegAddress}`)

    print(`\taura token:\t\t${auraTokenAddress}`)
    print(`\taura NFT:\t\t${auraNFTAddress}`)
    print(`\tap token:\t\t${apTokenAddress}`)

    print(`\tsplit reward percent:\t${splitRewardPercent / 10}%`)
    print(`\taura reward percent:\t${auraRewardPercent / 10}%`)
    print(`\tap reward percent:\t${apRewardPercent / 10}%\n`)
}

// 1. Deploy the Swap Rewards contract
async function deploySwapRewards() {
    print(`Deploy SwapRewards`)

    const SwapRewards = await ethers.getContractFactory('SwapRewards')
    const swapRewards = await SwapRewards.deploy(
        routerAddress,
        oracleFactoryAddress,
        refRegAddress,
        auraTokenAddress,
        auraNFTAddress,
        apTokenAddress,
        splitRewardPercent,
        auraRewardPercent,
        apRewardPercent
    )
    await swapRewards.deployTransaction.wait()

    print(`\tdeployed to ${swapRewards.address}\n`)

    return swapRewards.address
}

// 2. Register SwapRewards with Router.
async function registerWithRouter(swapRewardsAddress) {
    print(`Register SwapRewards ${short(swapRewardsAddress)} with Router`)

    const Router = await ethers.getContractFactory('AuraRouterV1')
    const router = Router.attach(routerAddress)
    await router.setSwapRewards(swapRewardsAddress, overrides)

    print(`Done\n`)
}

// 3. Register the swapRewards contract with the referralRegister as a recorder.
async function registerAsRecorder(swapRewardsAddress) {
    print(`Register SwapRewards ${short(swapRewardsAddress)} as Referral Register recorder`)

    const RefReg = await ethers.getContractFactory('ReferralRegister')
    const refReg = RefReg.attach(refRegAddress)
    await refReg.addRecorder(swapRewardsAddress, overrides)

    print(`Done\n`)
}

// 4. Register the swapRewards contract with the auraToken as a minter.
async function registerAsMinter(swapRewardsAddress) {
    print(`Register SwapRewards ${short(swapRewardsAddress)} as Aura Token minter`)

    const AuraToken = await ethers.getContractFactory('AuraToken')
    const auraToken = AuraToken.attach(auraTokenAddress)
    await auraToken.addMinter(swapRewardsAddress, overrides)

    print(`Done\n`)
}

// 5. Register swapRewards contract with the exchange's auraNFT as an accruer.
async function registerAsAccruer(swapRewardsAddress) {
    print(`Register SwapRewards ${short(swapRewardsAddress)} as AuraNFT accruer`)

    const AuraNFT = await ethers.getContractFactory('AuraNFT')
    const auraNFT = AuraNFT.attach(auraNFTAddress)
    await auraNFT.addAccruer(swapRewardsAddress, overrides)

    print(`Done\n`)
}

// Shorten the given string to the first and last n characters.
function short(str, n=4) {
    const first = str.slice(2, n+2)
    const last = str.slice(str.length-n, str.length)
    const newStr = `${first}...${last}`
    return newStr
}

function print(str) {
    if (verbose) {
        console.log(str)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
