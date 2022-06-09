/* 
 * @dev Used to (re)build all required references for Helix Nft
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/initHelixNft.js --network rinkeby
 */

const verbose = true

const overrides = {
    gasLimit: 9999999
}

const { ethers, network } = require(`hardhat`);
const env = require('./../constants/env')

const initials = require('./../constants/initials')
const contracts = require('./../constants/contracts')

/// Wallet making the transactions in this script
let wallet

/// The contract whose setters are being called by this script
let contract

const helixNftAddress = contracts.helixNFT[env.network]
const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]
const helixChefNftAddress = contracts.helixChefNFT[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await addMinter(helixNftBridgeAddress)
    await addStaker(helixChefNftAddress)

    print('done')
}

async function addStaker(stakerAddress) {
    print(`register ${stakerAddress} as HelixfNft staker`)
    let tx = await contract.addStaker(stakerAddress, overrides)
    await tx.wait()
}

async function addMinter(minterAddress) {
    print(`register ${minterAddress} as HelixNft minter`)
    let tx = await contract.addMinter(minterAddress, overrides)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)
    const contractFactory = await ethers.getContractFactory('HelixNFT')
    contract = await contractFactory.attach(helixNftAddress).connect(wallet)
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
