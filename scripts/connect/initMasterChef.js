/* 
 * @dev Used to (re)build all required references for Master Chef
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/initMasterChef.js --network ropsten
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

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await setReferralRegister(referralRegisterAddress)

    print('done')
}

async function setReferralRegister(address) {
    print(`set ${address} as referral register`)
    let tx = await contract.setReferralRegister(address, overrides)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load master chef: ${masterChefAddress}`)
    const contractFactory = await ethers.getContractFactory('MasterChef')
    contract = contractFactory.attach(masterChefAddress).connect(wallet)
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
