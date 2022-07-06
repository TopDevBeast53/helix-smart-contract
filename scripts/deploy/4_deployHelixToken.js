/*
 * @dev Deployment script for Helix Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deploy/4_deployHelixToken.js --network rinkeby
 *     npx hardhat run scripts/0_deploy/4_deployHelixToken.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { deployHelixToken } = require("../shared/deploy/deployers")

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
