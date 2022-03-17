/**
 * @dev AuraFactory and Router Deployment
 * 
 * command for deploy on bsc-testnet: 
 *      `npx hardhat run scripts/1_deployFactoryRouter.js --network testnetBSC`
 */

const { ethers } = require("hardhat");
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")

const setterFeeOnPairSwaps = addresses.setterFeeOnPairSwaps[env.network]
const poolReceiveTradeFee = addresses.poolReceiveTradeFee[env.network]
const factoryAddress = contracts.factory[env.network]
const routerWBNB = addresses.WBNB[env.network]

async function deployAuraFactory() {
    
    console.log(`------ Start deploying AuraFactory contract ---------`);
    const Factory = await ethers.getContractFactory("AuraFactory");
    const factory = await Factory.deploy(setterFeeOnPairSwaps);
    await factory.deployTransaction.wait();
    let factoryInstance = await factory.deployed();
    await factoryInstance.setFeeTo(poolReceiveTradeFee);
    let res = await factoryInstance.feeTo();
    console.log('fee - ', res);

    let INIT_CODE_HASH = await factoryInstance.INIT_CODE_HASH.call();
    console.log('INIT_CODE_HASH - ', INIT_CODE_HASH);
    console.log(`Aura Factory deployed to ${factory.address}`);
}

async function deployAuraRouter() {

    console.log(`------ Start deploying AuraRouter contract ---------`);
    const ContractRouter = await ethers.getContractFactory("AuraRouterV1");
    const contract = await ContractRouter.deploy(factoryAddress, routerWBNB);
    await contract.deployTransaction.wait();

    console.log(`AuraRouter deployed to ${contract.address}`);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    // await deployAuraFactory()
    await deployAuraRouter()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
