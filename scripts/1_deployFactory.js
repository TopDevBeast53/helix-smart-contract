/**
 * @dev HelixFactory deployment script
 * 
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/1_deployFactory.js --network testnetBSC
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/1_deployFactory.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat");
const addresses = require("./constants/addresses")
const env = require("./constants/env")

const setterFeeOnPairSwaps = addresses.setterFeeOnPairSwaps[env.network]
const poolReceiveTradeFee = addresses.poolReceiveTradeFee[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying HelixFactory contract ---------`);
    const Factory = await ethers.getContractFactory("HelixFactory");
    const factory = await upgrades.deployProxy(Factory, [setterFeeOnPairSwaps]); //upgrades. Factory.deploy(setterFeeOnPairSwaps);
    await factory.deployTransaction.wait();

    await factory.setFeeTo(poolReceiveTradeFee);
    let res = await factory.feeTo();
    console.log('fee - ', res);

    let INIT_CODE_HASH = await factory.INIT_CODE_HASH.call();
    console.log('INIT_CODE_HASH - ', INIT_CODE_HASH);
    console.log(`Helix Factory deployed to ${factory.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
