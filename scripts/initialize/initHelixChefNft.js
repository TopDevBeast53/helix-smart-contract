/* 
 * @dev Used to (re)build all required references for Helix Chef Nft
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/initHelixChefNft.js --network rinkeby
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

const helixChefNftAddress = contracts.helixChefNFT[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await addAccruer(feeHandlerAddress)

    print('done')
}

async function addAccruer(accruerAddress) {
    print(`register ${accruerAddress} as HelixChefNft accruer`)
    let tx = await contract.addAccruer(accruerAddress, overrides)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load Helix Chef Nft: ${helixChefNftAddress}`)
    const contractFactory = await ethers.getContractFactory('HelixChefNFT')
    contract = await contractFactory.attach(helixChefNftAddress).connect(wallet)
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
