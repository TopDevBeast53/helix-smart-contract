/**
 * deploy HelixNFT Bridge
 * 
 * run from root:
 *      npx hardhat run scripts/0_deploy/7_deployHelixNFTBridge.js --network rinkeby
 *      npx hardhat run scripts/0_deploy/7_deployHelixNFTBridge.js --network ropsten
 */

const { ethers, network } = require(`hardhat`);
const { deployHelixNftBridge } = require("../shared/deploy/deployers")

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
