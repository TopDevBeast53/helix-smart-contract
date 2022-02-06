/*
 * @dev Deploy the AuraMigrator contract with the provided AuraRouter address.
 * 
 * command to deploy on bsc-testnet, run the following from the project root:
 *      npx hardhat run scripts/deployMigrator.js --network testnetBSC
 */

const {ethers} = require('hardhat');

const routerAddress = '0x59201fb8cb2D61118B280c8542127331DD141654';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    
    console.log(`AuraRouter deployed at: ${routerAddress}`);

    console.log('Deploy AuraMigrator');
    const Migrator = await ethers.getContractFactory('AuraMigrator');
    const migrator = await Migrator.deploy(routerAddress);
    await migrator.deployTransaction.wait();
    console.log(`AuraMigrator deployed to ${migrator.address}`);
    // Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
    // Deployed at = 0xA95c10feBBB13f7730FecD4167c9A612e468A42b
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
