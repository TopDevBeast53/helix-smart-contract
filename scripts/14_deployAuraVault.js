/*
 * @dev Deployment script for Aura Vault contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/14_deployAuraVault.js --network testnetBSC
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')

// Define contract constructor arguments
const auraTokenAddress = contracts.auraToken[env.network]                                                                                 
const apTokenAddress = contracts.apToken[env.network]
const masterChefAddress = contracts.masterChef[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Aura Vault`);
    const ContractFactory = await ethers.getContractFactory('AuraVault');
    const contract = await ContractFactory.deploy(
        auraTokenAddress,       // token
        apTokenAddress,         // receipt token
        masterChefAddress,      // master chef
        deployer.address,       // admin 
        deployer.address        // treasury
    );     
    await contract.deployTransaction.wait();
    
    console.log(`Aura Vault deployed to ${contract.address}`);
    console.log('Done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
