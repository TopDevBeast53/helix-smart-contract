/**
 * @dev Router Deployment script
 * 
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/2_deployRouter.js --network testnetBSC
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/2_deployRouter.js --network rinkeby
 */

const { ethers } = require("hardhat");
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")

const factoryAddress = contracts.factory[env.network]
const WETH = addresses.WETH[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`router factory address ${factoryAddress}`)

    console.log(`------ Start deploying HelixRouter contract ---------`);
    const ContractRouter = await ethers.getContractFactory("HelixRouterV1");
    const contract = await ContractRouter.deploy(factoryAddress, WETH);
    await contract.deployTransaction.wait();

    console.log(`HelixRouter deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
