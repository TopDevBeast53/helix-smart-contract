/*
 * @dev Deployment script for Helix Factory contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployWeth9.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy WETH 9 test token`);
    const Weth = await ethers.getContractFactory('WETH9');
    const weth = await Weth.deploy();
    await weth.deployTransaction.wait();
    console.log(`WETH 9 test token deployed to ${weth.address}`);
    // Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
    // Deployed at = 0xa23a6b838Da8f72A95c6fBB37216f75B24457F95
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
