/*
 * deploy Helix Migrator
 * 
 * run from root: 
 *      npx hardhat run scripts/deploy/15_deployMigrator.js --network
 */

const { ethers } = require('hardhat');
const { deployMigrator } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    await deployMigrator(deployer)
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
