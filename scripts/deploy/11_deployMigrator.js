/*
 * deploy Helix Migrator
 * 
 * run from root: 
 *      npx hardhat run scripts/11_deployMigrator.js --network rinkeby
 */

const {ethers} = require('hardhat');
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const routerAddress = contracts.router[env.network];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log('Deploy HelixMigrator');
    const Migrator = await ethers.getContractFactory('HelixMigrator');
    const migrator = await Migrator.deploy(routerAddress);
    await migrator.deployTransaction.wait();

    console.log(`HelixMigrator deployed to ${migrator.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
