/*
 * @dev Deployment script for Test Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployTestToken.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

const name = 'Test Token B'
const symbol = 'TTB'
const totalSupply = '1000000000000000000000000000';        // 1 billion

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Test Token`);
    const TestToken = await ethers.getContractFactory('TestToken');
    const testToken = await TestToken.deploy(name, symbol, totalSupply);
    await testToken.deployTransaction.wait();
    console.log(`${name} deployed to ${testToken.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
