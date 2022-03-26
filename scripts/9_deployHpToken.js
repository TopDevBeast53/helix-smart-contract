/*
 * @dev Deployment script for AP Token / Helix LP contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/9_deployHpToken.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying HelixPoint token  ---------`);
    const ContractFactory = await ethers.getContractFactory('HelixLP');
    const contract = await ContractFactory.deploy();
    await contract.deployTransaction.wait();
    console.log(`HelixPoint token / HelixLP deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
