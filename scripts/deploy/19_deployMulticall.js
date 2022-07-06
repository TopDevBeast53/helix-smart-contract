/**
 * @dev AutoHelix Deployment
 *
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/deploy/19_deployMulticall.js --network
 */
const { ethers } = require(`hardhat`);
const { deployMulticall } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    await deployMulticall(deployer)
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
