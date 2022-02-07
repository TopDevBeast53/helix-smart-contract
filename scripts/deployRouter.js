/*
 * @dev Deployment script for Aura Router V1 contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployRouter.js --network testnetBSC
 */

// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
// Deployed at = 0x38433227c7a606ebb9ccb0acfcd7504224659b74
// Deployed at = 0xdb3B0F877123cfB92AA5A1EAF4A1E21665bD177c
// @cryptoBilly on Feb 7: deployed at = 0xa04af40A2A27D744b72Cd8F5aD39Fc62083F64FE

const { ethers } = require(`hardhat`);

const ENV = 'test';

const WBNB = {
    'test': '0xae13d989dac2f0debff460ac112a837c89baa7cd',
}
const FACTORY = {
    'test': '0xd224E4f3342f2e4000A2479Ecc7A8Db87896853f',
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    
    const factoryAddress = FACTORY[ENV];
    console.log(`Factory deployed at ${factoryAddress}`);

    console.log(`Deploy Aura Router V1`);
    const Router = await ethers.getContractFactory('AuraRouterV1');
    const router = await Router.deploy(factoryAddress, WBNB[ENV]);
    await router.deployTransaction.wait();
    console.log(`Aura Router V1 deployed to ${router.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
