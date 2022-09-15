/*
 * @dev Deployment script for Helix Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/4_deployHelixToken.js --network
 */

const { ethers } = require(`hardhat`);
const { deployHelixToken } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    await deployHelixToken(deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
