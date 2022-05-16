/*
 * @dev Deployment script for Token Tools contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/13_deployTokenTools.js --network testnetBSC
 * 
 *     npx hardhat run scripts/13_deployTokenTools.js --network rinkeby
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Token Tools`);
    const ContractFactory = await ethers.getContractFactory('TokenTools');
    const contract = await ContractFactory.deploy();     
    await contract.deployTransaction.wait();
    
    console.log(`Token Tools deployed to ${contract.address}`);
    console.log('Done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
