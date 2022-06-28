/**
 * @dev AutoHelix Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/0_deploy/19_deployMulticall.js --network ropsten
 */
const { ethers } = require(`hardhat`);
const { deployMulticall } = require("../shared/deploy/deployers")

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
