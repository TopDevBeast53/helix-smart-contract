/*
 * @dev Deployment script for Aura Factory contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployFactory.js --network testnetBSC
 */

// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
// Deployed at = 0xE1cF8D44Bb47b8915A70eA494254164f19b7080d
// Deployed at = 0xf3B84A2183A3326C30F2f53237d0c6816F0833CB

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Aura Factory`);
    const Factory = await ethers.getContractFactory('AuraFactory');
    const factory = await Factory.deploy(deployer.address);     
    await factory.deployTransaction.wait();
    
    console.log(`Aura Factory deployed to ${factory.address}`);

    console.log(`Setting feeTo to ${deployer.address}`);
    
    const deployedInstance = Factory.attach(factory.address);
    const tx = await deployedInstance.setFeeTo(deployer.address);
    await tx.wait();

    console.log('Done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
