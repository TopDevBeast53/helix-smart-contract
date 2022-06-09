/**
 *
 * @dev Swap Fee Rewards Deployment
 *
 * command to deploy on bsc-testnet:
 *      npx hardhat run scripts/12_deploySwapRewards.js --network rinkeby
 *
 * Workflow:
 *      0. Print the values that will be passed to the SwapRewards constructor
 *      1. Deploy the Swap Rewards contract
 *      2. Register SwapRewards with Router.
 *      3. Register the swapRewards contract with the referralRegister as a recorder.
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
const helixTokenAddress = contracts.helixToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const refRegAddress = contracts.referralRegister[env.network]
const routerAddress = contracts.router[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    print(`Deployer address: ${deployer.address}\n`)

    // Deploy the SwapRewards contract
    displayConstructorArgs()
    swapRewardsAddress = await deploySwapRewards()

    // Call setters on contracts which depend on swapRewards
    await registerWithRouter(swapRewardsAddress)
    await registerAsRecorder(swapRewardsAddress)
}

// 0. Print the values that will be passed to the SwapRewards constructor
function displayConstructorArgs() {
    print(`SwapRewards constructor arguments:`)

    print(`\thelix token:\t\t${helixTokenAddress}`)
    print(`\toracle factory:\t\t${oracleFactoryAddress}`)
    print(`\trefReg:\t\t\t${refRegAddress}`)
    print(`\trouter:\t\t\t${routerAddress}`)
}

// 1. Deploy the Swap Rewards contract
async function deploySwapRewards() {
    print(`Deploy SwapRewards`)

    const SwapRewards = await ethers.getContractFactory('SwapRewards')
    const swapRewards = await SwapRewards.deploy(
        helixTokenAddress,
        oracleFactoryAddress,
        refRegAddress,
        routerAddress
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
