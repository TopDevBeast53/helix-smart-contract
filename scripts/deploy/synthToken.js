/*
 * @dev Deployment script for Synth Token contract.
 */

const { ethers } = require(`hardhat`);
const { deploySynthToken } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    await deploySynthToken(deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
