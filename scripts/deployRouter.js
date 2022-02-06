/*
 * @dev Deployment script for Aura Router V1 contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployRouter.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    
    const factoryAddress = '0xf3B84A2183A3326C30F2f53237d0c6816F0833CB';
    console.log(`Factory deployed at ${factoryAddress}`);

    const wethAddress = '0xa23a6b838Da8f72A95c6fBB37216f75B24457F95';
    console.log(`WETH 9 test token deployed at ${wethAddress}`);

    console.log(`Deploy Aura Router V1`);
    const Router = await ethers.getContractFactory('AuraRouterV1');
    const router = await Router.deploy(factoryAddress, wethAddress);
    await router.deployTransaction.wait();
    console.log(`Aura Router V1 deployed to ${router.address}`);
    // Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
    // Deployed at = 0x38433227c7a606ebb9ccb0acfcd7504224659b74
    // Deployed at = 0xdb3B0F877123cfB92AA5A1EAF4A1E21665bD177c
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
