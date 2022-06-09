/* 
 * @dev Used to (re)build all required references for Helix Token
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/initHelixToken.js --network rinkeby
 */

const verbose = true

const overrides = {
    gasLimit: 9999999
}

const { ethers, network } = require(`hardhat`);
const env = require('./../constants/env')
const contracts = require('./../constants/contracts')

/// Wallet making the transactions in this script
let wallet

/// The contract whose setters are being called by this script
let contract 

const helixTokenAddress = contracts.helixToken[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const helixVaultAddress = contracts.helixVault[env.network]
const masterChefAddress = contracts.masterChef[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await addMinter(referralRegisterAddress)
    await addMinter(helixVaultAddress)
    await addMinter(masterChefAddress)

    print('done')
}

async function addMinter(minterAddress) {
    print(`register ${minterAddress} as HelixChefNft minter`)
    let tx = await contract.addMinter(minterAddress, overrides)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load helix token: ${helixTokenAddress}`)
    const contractFactory = await ethers.getContractFactory('HelixToken')
    contract = await contractFactory.attach(helixTokenAddress).connect(wallet)
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
