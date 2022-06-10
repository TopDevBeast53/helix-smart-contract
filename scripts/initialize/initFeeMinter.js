/* 
 * @dev Used to (re)build all required references for Fee Minter
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/initFeeMinter.js --network rinkeby
 */

const verbose = true

const { ethers } = require(`hardhat`);
const env = require('./../constants/env')
const contracts = require('./../constants/contracts')
const initials = require('./../constants/initials')

/// Wallet making the transactions in this script
let wallet

/// The contract whose setters are being called by this script
let contract 

const feeMinterAddress = contracts.feeMinter[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const helixVaultAddress = contracts.helixVault[env.network]
const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    let minters = [masterChefAddress, referralRegisterAddress, helixVaultAddress]
    await setToMintPercents(minters, toMintPercents)

    print('done')
}

async function setToMintPercents(minters, toMintPercents) {
    print(`set minter with percent:`)
    for (let i = 0; i < minters.length; i++) {
        print(`\t${minters[i]}:\t${toMintPercents[i]}`)
    }
    const tx = await contract.setToMintPercents(minters, toMintPercents)
    await tx.wait()
}

/// Load the contracts that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load fee minter: ${feeMinterAddress}`)
    const contractFactory = await ethers.getContractFactory('FeeMinter')
    contract = contractFactory.attach(feeMinterAddress).connect(wallet)
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
