/*
 * @dev Deployment script for VIP Presale contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/16_deployVipPresale.js --network testnetBSC
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// Define contract constructor arguments                                    // main  / test
const inputTokenAddress = initials.VIP_PRESALE_INPUT_TOKEN[env.network]     // BUSD  / TestTokenA
const outputTokenAddress = initials.VIP_PRESALE_OUTPUT_TOKEN[env.network]   // HELIX / TestTokenB
const treasuryAddress = initials.VIP_PRESALE_TREASURY[env.network]
const inputRate = initials.VIP_PRESALE_INPUT_RATE[env.network]
const outputRate = initials.VIP_PRESALE_OUTPUT_RATE[env.network]
const purchasePhaseDuration = initials.VIP_PRESALE_PURCHASE_PHASE_DURATION[env.network]
const withdrawPhaseDuration = initials.VIP_PRESALE_WITHDRAW_PHASE_DURATION[env.network]

// Define contract settings
const initialBalance = initials.VIP_PRESALE_INITIAL_BALANCE[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    // Deploy the contract
    console.log(`Deploy VIP Presale`)
    const ContractFactory = await ethers.getContractFactory('VipPresale')
    const contract = await ContractFactory.deploy(
        inputTokenAddress,
        outputTokenAddress,
        treasuryAddress,
        inputRate,
        outputRate,
        purchasePhaseDuration,
        withdrawPhaseDuration
    )     
    await contract.deployTransaction.wait()
    console.log(`Vip Presale deployed to ${contract.address}`)

    // Send funds of outputToken to the contract
    const IOutputToken = await ethers.getContractFactory('TestToken')
    outputToken = await IOutputToken.attach(outputTokenAddress).connect(deployer) 

    console.log(`Send ${initialBalance} tokens to presale`)
    // Add zeros since token has 18 decimals
    await outputToken.transfer(contract.address, initialBalance.toString() + '000000000000000000')
    console.log('Done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
