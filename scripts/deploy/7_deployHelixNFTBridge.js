/**
 * deploy HelixNFT Bridge
 * 
 * run from root:
 *      npx hardhat run scripts/deploy/7_deployHelixNFTBridge.js --network
 */

const { ethers, network } = require(`hardhat`);
const { deployHelixNftBridge } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    await deployHelixNftBridge(deployer) 
    console.log('done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
