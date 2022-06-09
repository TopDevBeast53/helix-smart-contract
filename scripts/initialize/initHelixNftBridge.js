/* 
 * @dev Used to (re)build all required references for Helix Nft bridge
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/initHelixNftBridge.js --network rinkeby
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

const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await addBridger(wallet.address)

    print('done')
}

async function addBridger(bridgerAddress) {
    print(`register ${bridgerAddress} as HelixNftBridge bridger`)
    let tx = await contract.addBridger(bridgerAddress, overrides)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load helix Nft bridge: ${helixNftBridgeAddress}`)
    const contractFactory = await ethers.getContractFactory('HelixNFTBridge')
    contract = await contractFactory.attach(helixNftBridgeAddress).connect(wallet)
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
