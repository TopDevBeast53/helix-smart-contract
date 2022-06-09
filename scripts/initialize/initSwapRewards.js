/* 
 * @dev Used to (re)build all required references for SwapRewards
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/initSwapRewards.js --network rinkeby
 */

const verbose = true

const overrides = {
    gasLimit: 9999999
}

const { ethers, network } = require(`hardhat`);
const env = require('./../constants/env')
const contracts = require('./../constants/contracts')

const swapRewardsAddress = contracts.swapRewards[env.network]
const helixTokenAddress = contracts.helixToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const routerAddress = contracts.router[env.network]

/// Wallet making the transactions in this script
let wallet

/// The contract whose setters are being called by this script
let contract

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await setHelixToken(helixTokenAddress)
    await setOracleFactory(oracleFactoryAddress)
    await setReferralRegister(referralRegisterAddress)
    await setRouter(routerAddress)

    print('done')
}

async function setHelixToken(address) {
    print(`register ${address} as SwapRewards helixToken`)
    // let tx = await contract.setHelixToken(address)
    // await tx.wait()
}

async function setOracleFactory(address) {
    print(`register ${address} as SwapRewards oracleFactory`)
    // let tx = await contract.setOracleFactory(address)
    // await tx.wait()
}

async function setReferralRegister(address) {
    print(`register ${address} as SwapRewards referralRegister`)
    // let tx = await contract.setRefReg(address)
    // await tx.wait()
}

async function setRouter(address) {
    print(`register ${address} as SwapRewards router`)
    // let tx = await contract.setRouter(address)
    // await tx.wait()
}

/// Load the contracts that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    // Load the contracts
    print('load contracts:')

    print(`load swap rewards: ${swapRewardsAddress}`)
    const contractFactory = await ethers.getContractFactory('SwapRewards')
    contract = await contractFactory.attach(swapRewardsAddress).connect(wallet)
}

/// Console.log str if verbose is true and false otherwise
function print(str) {
    if (verbose) console.log(str)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
