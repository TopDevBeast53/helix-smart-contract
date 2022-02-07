/*
 * @dev Deployment script for Test Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployTestToken.js --network testnetBSC
 */


// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
// Deployed at = 0xE80Bed05c18Cf4c491a82742A507D831B8aC1C0b
// Deployed at = 0x4cf6e39860B875dEeb8c577a88438f1Bb84C455A

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Test Token`);
    const TestToken = await ethers.getContractFactory('TestToken');
    const totalSupply = '1000000000000000000000000';
    const testToken = await TestToken.deploy(totalSupply);
    await testToken.deployTransaction.wait();
    console.log(`Test Token deployed to ${testToken.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
