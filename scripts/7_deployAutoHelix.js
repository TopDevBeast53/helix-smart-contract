/**
 * @dev AutoHelix Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/7_deployAutoHelix.js --network testnetBSC
 * 
 *      npx hardhat run scripts/7_deployAutoHelix.js --network rinkeby
 */
const { ethers, upgrades } = require(`hardhat`);
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")

const HelixTokenAddress = contracts.helixToken[env.network];
const MasterChefAddress = contracts.masterChef[env.network];
const TreasuryAddress = addresses.autoHelixTreasuryAddress[env.network];

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    console.log(`------ Start deploying AutoHelix contract ---------`);
    
    const AutoHelix = await ethers.getContractFactory(`AutoHelix`);
    const autoHelix = await upgrades.deployProxy(AutoHelix, [
        /*helix token address=*/HelixTokenAddress,
        /*master chef address=*/MasterChefAddress,
        /*treasury address=*/TreasuryAddress]);

    await autoHelix.deployTransaction.wait();
    console.log(`AutoHelix deployed to ${autoHelix.address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        autoHelix.address
    )
    console.log(`Implementation address: ${implementationAddress}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 
