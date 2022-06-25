/* 
 * @dev Used to transfer ownership to multiSig/timelock
 * 
 * Run from project root using:
 *     npx hardhat run scripts/transfer/feeMinter.js --network ropsten
 */

const verbose = true

const overrides = {
    gasLimit: 9999999
}

const { ethers } = require(`hardhat`);
const env = require('./../constants/env')
const contracts = require('./../constants/contracts')


/// ----- Only these should need to be changed ----- ///

/// The name of the contract as compiled
const contractName = "FeeMinter"

/// The name of the contract in the contracts mapping
const contractAddress = contracts.feeMinter[env.network]

/// True if owner should equal multiSig.address and false otherwise
const transferMultiSigOwner = true

/// True if timelockOwner should equal timelock.address and false otherwise
const transferTimelockOwner = true

/// ------------------------------------------------- ///


/// Wallet making the transactions in this script
let wallet

/// Contract whose ownership is being transferred to multiSig/timelock
let contract 

/// Address of the multiSig owner contract
const multiSigAddress = contracts.ownerMultiSig[env.network]

/// Address of the timelock owner contract
const timelockAddress = contracts.timelock[env.network]

/// Transfer ownership of the contract to multiSig/timelock 
async function main() {
    await load() 

    if (transferMultiSigOwner) {
        await setMultiSigOwner(multiSigAddress)
    }

    if (transferTimelockOwner) {
        await setTimelockOwner(timelockAddress) 
    }

    print('done')
}

/// Transfer ownership of contract to multiSig contract
async function setMultiSigOwner(newOwnerAddress) {
    print(`transfer ownership of ${contractName} to multiSig at ${newOwnerAddress}`)
    let tx = await contract.transferOwnership(newOwnerAddress, overrides)
    await tx.wait()
}

/// Transfer ownership of contract to timelock contract
async function setTimelockOwner(newOwnerAddress) {
    print(`transfer timelock ownership of ${contractName} to timelock at ${newOwnerAddress}`)
    let tx = await contract.transferTimelockOwnership(newOwnerAddress, overrides)
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    print(`load ${contractName}: ${contractAddress}`)
    const contractFactory = await ethers.getContractFactory(contractName)
    contract = contractFactory.attach(contractAddress).connect(wallet)
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
