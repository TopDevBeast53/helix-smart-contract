/**
 * @dev Router Deployment script
 * 
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/1_2_deployRouter.js --network testnetBSC
 */

const { ethers } = require("hardhat");
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")

const factoryAddress = contracts.factory[env.network]
const routerWBNB = addresses.WBNB[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`router factory address ${factoryAddress}`)

    console.log(`------ Start deploying HelixRouter contract ---------`);
    const ContractRouter = await ethers.getContractFactory("HelixRouterV1");
    const contract = await ContractRouter.deploy(factoryAddress, routerWBNB);
    await contract.deployTransaction.wait();

    console.log(`HelixRouter deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
