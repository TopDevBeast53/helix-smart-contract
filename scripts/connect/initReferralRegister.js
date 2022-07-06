/* 
 * @dev Used to (re)build all required references for Referral Register
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/initReferralRegister.js --network ropsten
 */

const verbose = true

const overrides = {
    gasLimit: 9999999
}

const { ethers } = require(`hardhat`);
const env = require('./../constants/env')
const contracts = require('./../constants/contracts')

/// Wallet making the transactions in this script
let wallet

/// The contract whose setters are being called by this script
let contract 

const referralRegisterAddress = contracts.referralRegister[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]
const masterChefAddress = contracts.masterChef[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await addRecorder(swapRewardsAddress)
    await addRecorder(masterChefAddress)

    print('done')
}

async function addRecorder(address) {
    print(`add ${address} as recorder`)
    let tx = await contract.addRecorder(address, overrides)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load referral register: ${referralRegisterAddress}`)
    const contractFactory = await ethers.getContractFactory('ReferralRegister')
    contract = contractFactory.attach(referralRegisterAddress).connect(wallet)
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
