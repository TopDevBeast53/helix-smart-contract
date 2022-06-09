/*
 * @dev Deployment script for Helix Vault contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/13_deployHelixVault.js --network testnetBSC
 * 
 *     npx hardhat run scripts/13_deployHelixVault.js --network rinkeby
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// Define contract constructor arguments
const helixTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const startBlock = initials.HELIX_VAULT_START_BLOCK[env.network]
const lastRewardBlock = initials.HELIX_VAULT_LAST_REWARD_BLOCK[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Helix Vault`);
    const VaultContract = await ethers.getContractFactory('HelixVault');
    const vaultProxy = await upgrades.deployProxy(
        VaultContract,
        [
            helixTokenAddress,
            feeHandlerAddress,
            feeMinterAddress,
            startBlock,
            lastRewardBlock
        ]
    )     
    await vaultProxy.deployTransaction.wait();
    
    console.log(`Helix Vault proxy deployed to ${vaultProxy.address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        vaultProxy.address
    )
    console.log(`Implementation address: ${implementationAddress}`)
    
    console.log(`------ Add Vault as HelixToken minter ---------`);
    const HelixToken = await ethers.getContractFactory(`HelixToken`);
    const helixToken = HelixToken.attach(helixTokenAddress);
    let tx = await helixToken.addMinter(vaultProxy.address, {gasLimit: 3000000});
    await tx.wait();

    console.log(`Done!`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
