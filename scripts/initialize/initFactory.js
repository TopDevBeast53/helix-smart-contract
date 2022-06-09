/* 
 * @dev Used to (re)build all required references for Helix Factory
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/initFactory.js --network rinkeby
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

const factoryAddress = contracts.factory[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    await load() 

    await setOracleFactory(oracleFactoryAddress)

    print('done')
}

async function setOracleFactory(oracleFactoryAddress) {
    print(`register ${oracleFactoryAddress} as Factory oracleFactory`)
    let tx = await contract.setOracleFactory(oracleFactoryAddress)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load factory: ${factoryAddress}`)
    const contractFactory = await ethers.getContractFactory('HelixFactory')
    contract = await contractFactory.attach(factoryAddress).connect(wallet)
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
