/*
 * @dev Deployment script for Aura Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployAuraToken.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Aura Token`);
    const ContractFactory = await ethers.getContractFactory('AuraToken');
    const contract = await ContractFactory.deploy();
    await contract.deployTransaction.wait();
    console.log(`Aura Token deployed to ${contract.address}`);
    // Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
    // Deployed at = 0x3bE0a93151B04A01177E8548515533b08B417034
    // Deployed at = 0xc02c4193C66D4dF272D5fE0d26481dFE760eC09c
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
