/*
 * @dev Deploy the AuraMigrator contract with the provided AuraRouter address.
 * 
 * command to deploy on bsc-testnet, run the following from the project root:
 *      npx hardhat run scripts/deployMigrator.js --network testnetBSC
 */

const {ethers} = require('hardhat');
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const routerAddress = contracts.router[env.network];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

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
