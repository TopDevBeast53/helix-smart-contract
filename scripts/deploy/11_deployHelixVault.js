/*
 * deploy Helix Vault
 *
 * run from root: 
 *     npx hardhat run scripts/deploy/11_deployHelixVault.js --network rinkeby
 */

// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('../constants/env')
const contracts = require('../constants/contracts')
const initials = require('../constants/initials')

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

    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
