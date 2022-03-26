/*
 * @dev Deployment script for Helix Vault contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/13_deployHelixVault.js --network testnetBSC
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// Define contract constructor arguments
const helixTokenAddress = contracts.helixToken[env.network]
const rewardPerBlock = initials.VAULT_REWARD_PER_BLOCK[env.network]
const startBlock = initials.VAULT_START_BLOCK[env.network]
const bonusEndBlock = initials.VAULT_BONUS_END_BLOCK[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Helix Vault`);
    const ContractFactory = await ethers.getContractFactory('HelixVault');
    const contract = await ContractFactory.deploy(
        helixTokenAddress,       // token
        helixTokenAddress,       // receipt token
        rewardPerBlock,
        startBlock,
        bonusEndBlock
    );     
    await contract.deployTransaction.wait();
    
    console.log(`Helix Vault deployed to ${contract.address}`);
    console.log('Done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
