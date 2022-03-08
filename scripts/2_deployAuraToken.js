/*
 * @dev Deployment script for Aura Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/2_deployAuraToken.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying Aura Token ---------`);
    const ContractFactory = await ethers.getContractFactory('AuraToken');
    const contract = await ContractFactory.deploy();
    await contract.deployTransaction.wait();
    console.log(`Aura Token deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
