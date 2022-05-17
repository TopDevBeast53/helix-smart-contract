/**
 *
 * @dev Swap Fee Rewards Deployment
 *
 * command to deploy on bsc-testnet:
 *      npx hardhat run scripts/11_deploySwapRewards.js --network testnetBSC
 * 
 *      npx hardhat run scripts/11_deploySwapRewards.js --network rinkeby
 *
 * Workflow:
 *      0. Print the values that will be passed to the SwapRewards constructor
 *      1. Deploy the Swap Rewards contract
 *      2. Register SwapRewards with Router.
 *      3. Register the swapRewards contract with the referralRegister as a recorder.
 *      4. Register the swapRewards contract with the helixToken as a minter.
 *      5. Register swapRewards contract with the exchange's helixNFT as an accruer.
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

const helixTokenAddress = contracts.helixToken[env.network]
const helixNFTAddress = contracts.helixNFT[env.network]
const hpTokenAddress = contracts.hpToken[env.network]

const splitRewardPercent = initials.SPLIT_REWARD_PERCENT[env.network]
const helixRewardPercent = initials.HELIX_REWARD_PERCENT[env.network]
const hpRewardPercent = initials.HP_REWARD_PERCENT[env.network]

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

    print(`\thelix token:\t\t${helixTokenAddress}`)
    print(`\thelix NFT:\t\t${helixNFTAddress}`)
    print(`\thp token:\t\t${hpTokenAddress}`)

    print(`\tsplit reward percent:\t${splitRewardPercent / 10}%`)
    print(`\thelix reward percent:\t${helixRewardPercent / 10}%`)
    print(`\thp reward percent:\t${hpRewardPercent / 10}%\n`)
}

// 1. Deploy the Swap Rewards contract
async function deploySwapRewards() {
    print(`Deploy SwapRewards`)

    const SwapRewards = await ethers.getContractFactory('SwapRewards')
    const swapRewards = await SwapRewards.deploy(
        routerAddress,
        oracleFactoryAddress,
        refRegAddress,
        helixTokenAddress,
        helixNFTAddress,
        hpTokenAddress,
        splitRewardPercent,
        helixRewardPercent,
        hpRewardPercent
    )
    await swapRewards.deployTransaction.wait()

    print(`\tdeployed to ${swapRewards.address}\n`)

    return swapRewards.address
}

// 2. Register SwapRewards with Router.
async function registerWithRouter(swapRewardsAddress) {
    print(`Register SwapRewards ${short(swapRewardsAddress)} with Router`)

    const Router = await ethers.getContractFactory('HelixRouterV1')
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

// 4. Register the swapRewards contract with the helixToken as a minter.
async function registerAsMinter(swapRewardsAddress) {
    print(`Register SwapRewards ${short(swapRewardsAddress)} as Helix Token minter`)

    const HelixToken = await ethers.getContractFactory('HelixToken')
    const helixToken = HelixToken.attach(helixTokenAddress)
    await helixToken.addMinter(swapRewardsAddress, overrides)

    print(`Done\n`)
}

// 5. Register swapRewards contract with the exchange's helixNFT as an accruer.
async function registerAsAccruer(swapRewardsAddress) {
    print(`Register SwapRewards ${short(swapRewardsAddress)} as HelixNFT accruer`)

    const HelixNFT = await ethers.getContractFactory('HelixNFT')
    const helixNFT = HelixNFT.attach(helixNFTAddress)
    await helixNFT.addAccruer(swapRewardsAddress, overrides)

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
