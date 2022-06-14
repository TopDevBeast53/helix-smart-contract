/*
 * @dev Deployment script for Public Presale contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/17_deployPublicPresale.js --network testnetBSC
 * 
 *     npx hardhat run scripts/deploy/deployPublicPresale.js --network rinkeby
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('../constants/env')
const contracts = require('../constants/contracts')
const initials = require('../constants/initials')

// Define contract constructor arguments                                    
const inputTokenAddress = initials.PUBLIC_PRESALE_INPUT_TOKEN[env.network]     // USDC  / TestTokenA
const outputTokenAddress = initials.PUBLIC_PRESALE_OUTPUT_TOKEN[env.network]   // HELIX / TestTokenB
const treasuryAddress = initials.PUBLIC_PRESALE_TREASURY[env.network]
const inputRate = initials.PUBLIC_PRESALE_INPUT_RATE[env.network]
const outputRate = initials.PUBLIC_PRESALE_OUTPUT_RATE[env.network]
const purchasePhaseDuration = initials.PUBLIC_PRESALE_PURCHASE_PHASE_DURATION[env.network]

// Define contract settings
const initialBalance = initials.PUBLIC_PRESALE_INITIAL_BALANCE[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    // Deploy the contract
    console.log(`Deploy Public Presale`)
    const ContractFactory = await ethers.getContractFactory('PublicPresale')
    const contract = await ContractFactory.deploy(
        inputTokenAddress,
        outputTokenAddress,
        treasuryAddress,
        inputRate,
        outputRate,
        purchasePhaseDuration
    )     
    await contract.deployTransaction.wait()
    console.log(`Public Presale deployed to ${contract.address}`)

    // Send funds of outputToken to the contract
    // const IOutputToken = await ethers.getContractFactory('TestToken')
    // const outputToken = IOutputToken.attach(outputTokenAddress).connect(deployer) 

    // console.log(`Send ${initialBalance} tokens to presale`)
    // // Add zeros since token has 18 decimals
    // await outputToken.transfer(contract.address, initialBalance.toString() + '000000000000000000')
    console.log('Done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
