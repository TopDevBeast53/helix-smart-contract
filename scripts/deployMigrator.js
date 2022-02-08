/*
 * @dev Deploy the AuraMigrator contract with the provided AuraRouter address.
 * 
 * command to deploy on bsc-testnet, run the following from the project root:
 *      npx hardhat run scripts/deployMigrator.js --network testnetBSC
 */

// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
// Deployed at = 0x6D237B35cCa79f367Ecac7743555C3f3213fA77f

const {ethers} = require('hardhat');

const ENV = 'test';

const ROUTER = {
    'test': '0x38433227c7a606ebb9ccb0acfcd7504224659b74',
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    const routerAddress = ROUTER[ENV];
    console.log(`AuraRouter deployed at: ${routerAddress}`);

    console.log('Deploy AuraMigrator');
    const Migrator = await ethers.getContractFactory('AuraMigrator');
    const migrator = await Migrator.deploy(routerAddress);
    await migrator.deployTransaction.wait();

    console.log(`AuraMigrator deployed to ${migrator.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
