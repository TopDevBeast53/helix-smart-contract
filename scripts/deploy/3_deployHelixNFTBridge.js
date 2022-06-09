/**
 * @dev HelixNFT Bridge Deployment
 * 
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/3_deployHelixNFTBridge.js --network rinkeby
 *       
 * Workflow:
 * 
 *      1. Deploy `HelixNFTBridge` contract.
 *      2. Optionally add bridger accounts
 */
const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const HelixNFTAddress = contracts.helixNFT[env.network];
 
async function addBridger(bridgeAddress, bridgerAddress) {
    const [deployer] = await ethers.getSigners();
    console.log(`------ Adding ${bridgerAddress} as Bridger to HelixNFTBridge ---------`);
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
    const HelixNFTBridge = await ethers.getContractFactory(`HelixNFTBridge`);
    const bridge = HelixNFTBridge.attach(bridgeAddress);

    let tx = await bridge.addBridger(bridgerAddress, {nonce: nonce, gasLimit: 3000000});
    await tx.wait();
}

async function addMinterToHelixNFT(bridgeAddress) {
    const [deployer] = await ethers.getSigners();
    console.log(`------ Adding ${bridgeAddress} as Minter to HelixNFT ---------`);
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    const IHelixNFT = await ethers.getContractFactory("HelixNFT");
    const HelixNFT = IHelixNFT.attach(HelixNFTAddress);

    let tx = await HelixNFT.addMinter(bridgeAddress, {nonce: nonce, gasLimit: 3000000});
    await tx.wait();
    console.log(`------ Added ${bridgeAddress} as Minter to HelixNFT ---------`);
}

async function main() {
 
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
     
    const nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    console.log(`------ Start deploying Helix NFT Bridge ---------`);
    const HelixNFTBridge = await ethers.getContractFactory(`HelixNFTBridge`);
    bridge = await HelixNFTBridge.deploy(
       /*HELIX NFT Contract address=*/HelixNFTAddress,
       /*additional txn params=*/{nonce: nonce});
    await bridge.deployTransaction.wait();
    console.log(`HelixNFTBridge deployed to ${bridge.address}`);

    await addBridger(bridge.address, deployer.address);

    await addMinterToHelixNFT(bridge.address);
}

// To add a bridger, comment out main() and uncomment addBridger with proper arguments
// addBridger(HelixNFTAddress, input address you want)
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 
