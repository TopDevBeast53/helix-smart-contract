/*
 * @dev Deployment script for AP Token / Aura LP contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/10_deployApToken.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying AP token  ---------`);
    const ContractFactory = await ethers.getContractFactory('AuraLP');
    const contract = await ContractFactory.deploy();
    await contract.deployTransaction.wait();
    console.log(`AP token / AuraLP deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
