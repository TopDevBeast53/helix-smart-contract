/*
 * @dev Deployment script for Helix Vault contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/14_deployHelixVault.js --network testnetBSC
 * 
 *     npx hardhat run scripts/14_deployHelixVault.js --network rinkeby
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// Define contract constructor arguments
const helixTokenAddress = contracts.helixToken[env.network]
const rewardPerBlock = initials.HELIX_VAULT_REWARD_PER_BLOCK[env.network]
const startBlock = initials.HELIX_VAULT_START_BLOCK[env.network]
const bonusEndBlock = initials.HELIX_VAULT_BONUS_END_BLOCK[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Helix Vault`);
    const ContractFactory = await ethers.getContractFactory('HelixVault');
    const vaultContract = await ContractFactory.deploy(
        helixTokenAddress,       // token
        rewardPerBlock,
        startBlock,
        bonusEndBlock
    );     
    await vaultContract.deployTransaction.wait();
    
    console.log(`Helix Vault deployed to ${vaultContract.address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        vaultContract.address
    )
    console.log(`Implementation address: ${implementationAddress}`)
    
    console.log(`------ Add MasterChef as Minter to HelixToken ---------`);
    const HelixToken = await ethers.getContractFactory(`HelixToken`);
    const helixToken = HelixToken.attach(helixTokenAddress);

    let tx = await helixToken.addMinter(vaultContract.address, {gasLimit: 3000000});
    await tx.wait();
    console.log(`Done!`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
