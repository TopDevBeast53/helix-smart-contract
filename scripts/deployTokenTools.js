/*
 * @dev Deployment script for Token Tools contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployTokenTools.js --network testnetBSC
 */

// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
// Deployed at = 0xA8156dd9D4Ab1fc2C2eb592B98e340C56aadA4E9 

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
