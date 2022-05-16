/*
 * @dev Deployment script for LP Swap contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/17_deployLpSwap.js --network testnetBSC
 * 
 * 
 *     npx hardhat run scripts/17_deployLpSwap.js --network rinkeby
 */

// Define script parameters
const hre = require('hardhat')
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// Define contract constructor arguments
const treasuryAddress = initials.LP_SWAP_TREASURY[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}\n`)
    
    console.log(`Deploy LP Swap`)
    const ContractFactory = await ethers.getContractFactory('LpSwap')
    const contract = await ContractFactory.deploy(
        treasuryAddress
    )     
    await contract.deployTransaction.wait()
    console.log(`LP Swap deployed to ${contract.address}`)
    console.log(`Remember to save this address to ./scripts/constants/contracts.js\n`)

    console.log('Done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
