/*
 * @dev Deploy the AuraMigrator contract with the provided AuraRouter address.
 * 
 * command to deploy on bsc-testnet, run the following from the project root:
 *      npx hardhat run scripts/deployMigrator.js --network testnetBSC
 */

// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
// Deployed at = 0x6D237B35cCa79f367Ecac7743555C3f3213fA77f

const {ethers} = require('hardhat');
const contracts = require("./constants/contracts")
const env = require("./constants/env")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    const routerAddress = contracts.router[env.network];
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
