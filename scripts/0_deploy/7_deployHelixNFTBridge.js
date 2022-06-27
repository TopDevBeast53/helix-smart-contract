/**
 * deploy HelixNFT Bridge
 * 
 * run from root:
 *      npx hardhat run scripts/0_deploy/7_deployHelixNFTBridge.js --network rinkeby
 *      npx hardhat run scripts/0_deploy/7_deployHelixNFTBridge.js --network ropsten
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("../constants/contracts")
const initials = require("../constants/initials")
const env = require("../constants/env")

const helixNFTAddress = contracts.helixNFT[env.network]
const adminAddress = initials.BRIDGE_ADMIN_ADDRESS[env.network]
const feeETH = initials.BRIDGE_FEE_ETH_AMOUNT[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
     
    const nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    console.log(`------ Start deploying Helix NFT Bridge ---------`);
    const HelixNFTBridge = await ethers.getContractFactory(`HelixNFTBridge`);
    bridge = await HelixNFTBridge.deploy(helixNFTAddress, adminAddress, feeETH, {nonce: nonce});
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
 
