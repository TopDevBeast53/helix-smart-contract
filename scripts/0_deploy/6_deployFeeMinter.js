/**
 * deploy FeeHandler
 * 
 * run from root: 
 *      npx hardhat run scripts/0_deploy/6_deployFeeMinter.js --network ropsten
 */

const { ethers } = require("hardhat")
const { deployFeeMinter } = require("../shared/deploy/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    await deployFeeMinter(deployer)
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 
