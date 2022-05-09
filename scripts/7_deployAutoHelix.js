/**
 * @dev AutoHelix Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/6_deployAutoHelix.js --network testnetBSC
 * 
 * Prereqs:
 *      1. Deploy `MasterChef` contract (if not deployed).      
 * 
 * Workflow:
 *      2. Update variables with according addresses.
 *      3. Deploy the AutoHelix contract.
 */
const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")

const HelixTokenAddress = contracts.helixToken[env.network];
const MasterChefAddress = contracts.masterChef[env.network];
const TreasuryAddress = addresses.autoHelixTreasuryAddress[env.network];

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    console.log(`------ Start deploying AutoHelix contract ---------`);
    const AutoHelix = await ethers.getContractFactory(`AutoHelix`);
    let auto = await AutoHelix.deploy(
    /*helix token address=*/HelixTokenAddress,
    /*master chef address=*/MasterChefAddress,
    /*treasury address=*/TreasuryAddress, {nonce: nonce});
    await auto.deployTransaction.wait();
    console.log(`AutoHelix deployed to ${auto.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 