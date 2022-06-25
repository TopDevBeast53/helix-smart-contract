/*
 * @dev Deployment script for Helix Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/4_deployHelixToken.js --network ropsten
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying Helix Token ---------`);
    const ContractFactory = await ethers.getContractFactory('HelixToken');
    const contract = await ContractFactory.deploy();
    await contract.deployTransaction.wait();
    console.log(`Helix Token deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
