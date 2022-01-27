const { ethers } = require(`hardhat`);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"])

    console.log(`Deploy SwapFeeRewardsWithAP`);
    const SwapFee = await ethers.getContractFactory('SwapFeeRewardsWithAP');
    const swapFee = await SwapFee.deploy();
    await swapFee.deployTransaction.wait();
    console.log(`SwapFeeRewardsWithAP deployed to ${swapFee.address}`);
    // Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654
    // Deployed at = 0xAd34Cac48cAC8e8dD0b46134f796F983ACd10bb6
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
