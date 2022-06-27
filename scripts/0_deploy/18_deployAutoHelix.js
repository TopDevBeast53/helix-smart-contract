/**
 * deploy Auto Helix
 *
 * run from root:
 *      npx hardhat run scripts/0_deploy/18_deployAutoHelix.js --network ropsten
 */

const { ethers, upgrades } = require(`hardhat`);
const contracts = require("../constants/contracts")
const addresses = require("../constants/addresses")
const env = require("../constants/env")

const HelixTokenAddress = contracts.helixToken[env.network];
const MasterChefAddress = contracts.masterChef[env.network];
const treasuryAddress = addresses.TREASURY[env.network];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    console.log(`------ Start deploying AutoHelix contract ---------`);
    
    const AutoHelix = await ethers.getContractFactory(`AutoHelix`);
    const autoHelix = await upgrades.deployProxy(AutoHelix, [
        /*helix token address=*/HelixTokenAddress,
        /*master chef address=*/MasterChefAddress,
        /*treasury address=*/treasuryAddress]);

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
 
