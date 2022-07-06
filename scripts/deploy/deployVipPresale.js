/*
 * @dev Deployment script for VIP Presale contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/16_deployVipPresale.js --network testnetBSC
 */

// Define script parameters
const hre = require('hardhat')
const { ethers } = require(`hardhat`)
const env = require('../constants/env')
const contracts = require('../constants/contracts')
const initials = require('../constants/initials')

// Define contract constructor arguments                                    // main  / test
const inputTokenAddress = initials.VIP_PRESALE_INPUT_TOKEN[env.network]     // BUSD  / TestTokenA
const treasuryAddress = initials.VIP_PRESALE_TREASURY[env.network]
const inputRate = initials.VIP_PRESALE_INPUT_RATE[env.network]
const outputRate = initials.VIP_PRESALE_OUTPUT_RATE[env.network]
const purchasePhaseDuration = initials.VIP_PRESALE_PURCHASE_PHASE_DURATION[env.network]
const withdrawPhaseDuration = initials.VIP_PRESALE_WITHDRAW_PHASE_DURATION[env.network]

// Define contract settings
const initialBalance = initials.VIP_PRESALE_INITIAL_BALANCE[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}\n`)
    
    // Deploy the HELIX-P Output Token
    console.log(`Deploy Helix-P Token`)
    const HelixPFactory = await ethers.getContractFactory('HelixPToken')
    const helixP = await HelixPFactory.deploy()
    await helixP.deployTransaction.wait()
    console.log(`Helix-P Token deployed to ${helixP.address}\n`)

    // Deploy the VIP Presale Contract
    console.log(`Deploy VIP Presale`)
    const VipPresaleFactory = await ethers.getContractFactory('VipPresale')
    const vipPresale = await VipPresaleFactory.deploy(
        inputTokenAddress,
        helixP.address,
        treasuryAddress,
        inputRate,
        outputRate,
        purchasePhaseDuration,
        withdrawPhaseDuration
    )     
    await vipPresale.deployTransaction.wait()
    console.log(`Vip Presale deployed to ${vipPresale.address}`)
    console.log(`Remember to save this address to ./scripts/constants/contracts.js\n`)

    // Transfer initial balance (20,000,000) of HELIX-P to VIP Presale 
    console.log(`Transfer ${initialBalance} HELIX-P to VIP Presale`)
    // Add zeros since token has 18 decimals
    tx = await helixP.transfer(vipPresale.address, initialBalance.toString() + '000000000000000000')
    await tx.wait()

    // Confirm the VIP Presale balance of HELIX-P
    console.log(`VIP Presale has a HELIX-P balance of ${await helixP.balanceOf(vipPresale.address)}`)
    console.log(`Balance will have 18 additional zeros, that's expected`)

    // Burn the remaining balance in deployer wallet
    // deployer must be a minter to burn
    console.log(`Burn remaining HELIX-P`)
    tx = await helixP.addMinter(deployer.address)
    await tx.wait() 
    const deployerBalance = await helixP.balanceOf(deployer.address)
    tx = await helixP.burn(deployer.address, deployerBalance)
    await tx.wait()

    // Confirm the deployer balance of HELIX-P
    console.log(`Deployer has a HELIX-P balance of ${await helixP.balanceOf(deployer.address)}\n`)

    console.log(`Verify VIP Presale contract`)
    console.log(`Expect verification to fail if identical contract has already been verified\n`)
    let res = await hre.run("verify:verify", {
        address: vipPresale.address,
        constructorArguments:
            [ 
                inputTokenAddress,
                helixP.address,
                treasuryAddress,
                inputRate,
                outputRate,
                purchasePhaseDuration,
                withdrawPhaseDuration
            ]   
    })

    console.log('Done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
