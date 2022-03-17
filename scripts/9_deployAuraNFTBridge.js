/**
 * @dev AuraNFT Bridge Deployment
 * 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/9_deployAuraNFTBridge.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `AuraNFTBridge` contract.
 *      2. Optionally add bridger accounts
 */
const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const AuraNFTAddress = contracts.auraNFT[env.network];
 
async function addBridger(bridgeAddress, bridgerAddress) {
    const [deployer] = await ethers.getSigners();
    console.log(`------ Adding ${bridgerAddress} as Bridger to AuraNFTBridge ---------`);
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
    const AuraNFTBridge = await ethers.getContractFactory(`AuraNFTBridge`);
    const bridge = AuraNFTBridge.attach(bridgeAddress);

    let tx = await bridge.addBridger(bridgerAddress, {nonce: nonce, gasLimit: 3000000});
    await tx.wait();
}

async function addMinterToAuraNFT(bridgeAddress) {
    const [deployer] = await ethers.getSigners();
    console.log(`------ Adding ${bridgeAddress} as Minter to AuraNFT ---------`);
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    const IAuraNFT = await ethers.getContractFactory("AuraNFT");
    const AuraNFT = IAuraNFT.attach(AuraNFTAddress);

    let tx = await AuraNFT.addMinter(bridgeAddress, {nonce: nonce, gasLimit: 3000000});
    await tx.wait();
    console.log(`------ Added ${bridgeAddress} as Minter to AuraNFT ---------`);
}

async function main() {
 
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
     
    const nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    console.log(`------ Start deploying Aura NFT Bridge ---------`);
    const AuraNFTBridge = await ethers.getContractFactory(`AuraNFTBridge`);
    bridge = await AuraNFTBridge.deploy(
       /*AURA NFT Contract address=*/AuraNFTAddress,
       /*additional txn params=*/{nonce: nonce});
    await bridge.deployTransaction.wait();
    console.log(`AuraNFTBridge deployed to ${bridge.address}`);

    await addBridger(bridge.address, deployer.address);

    await addMinterToAuraNFT(bridge.address);
}

// To add a bridger, comment out main() and uncomment addBridger with proper arguments
// addBridger(AuraNFTAddress, input address you want)
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 