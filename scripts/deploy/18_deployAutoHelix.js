/**
 * deploy Auto Helix
 *
 * run from root:
 *      npx hardhat run scripts/deploy/18_deployAutoHelix.js --network
 */

const { ethers } = require(`hardhat`);
const { deployAutoHelix } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    await deployAutoHelix(deployer)
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 
