/**
 * deploy HelixNFT Bridge
 * 
 * run from root:
 *      npx hardhat run scripts/deploy/3_deployHelixNFTBridge.js --network rinkeby
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("../constants/contracts")
const env = require("../constants/env")

const helixNFTAddress = contracts.helixNFT[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
     
    const nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    console.log(`------ Start deploying Helix NFT Bridge ---------`);
    const HelixNFTBridge = await ethers.getContractFactory(`HelixNFTBridge`);
    bridge = await HelixNFTBridge.deploy(
       /*HELIX NFT Contract address=*/helixNFTAddress,
       /*additional txn params=*/{nonce: nonce});
    await bridge.deployTransaction.wait();
    console.log(`HelixNFTBridge deployed to ${bridge.address}`);
    console.log('done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 
