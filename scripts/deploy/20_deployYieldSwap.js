/*
 * @dev Deployment script for Yield Swap contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/20_deployYieldSwap.js --network
 */

// Define script parameters
const { ethers } = require(`hardhat`)
const { deployYieldSwap } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    await deployYieldSwap(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
