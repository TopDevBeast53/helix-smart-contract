/*
 * deploy Helix Vault
 *
 * run from root: 
 *     npx hardhat run scripts/deploy/11_deployHelixVault.js --network
 */

const { ethers } = require(`hardhat`)
const { deployHelixVault } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    await deployHelixVault(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
