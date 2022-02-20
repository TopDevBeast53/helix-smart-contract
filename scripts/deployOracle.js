/*
 * @dev Deployment script for Oracle contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployOracle.js --network testnetBSC
 */

// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Oracle`);
    const ContractFactory = await ethers.getContractFactory('Oracle');
    const contract = await ContractFactory.deploy();     
    await contract.deployTransaction.wait();
    
    console.log(`Oracle deployed to ${contract.address}`);
    console.log('Done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
