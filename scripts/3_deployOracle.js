/*
 * @dev Deployment script for Oracle contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/3_deployOracle.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

const contracts = require('./constants/contracts');
const initials = require('./constants/initials');
const env = require('./constants/env');

const FactoryAddress = contracts.factory[env.network];
const ORACLE_WINDOW_SIZE = initials.ORACLE_WINDOW_SIZE[env.network];
const ORACLE_GRANULARITY = initials.ORACLE_GRANULARITY[env.network];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying Oracle -------`);
    const ContractFactory = await ethers.getContractFactory('Oracle');
    const contract = await ContractFactory.deploy(FactoryAddress, ORACLE_WINDOW_SIZE, ORACLE_GRANULARITY, { gasLimit: 3000000 });
    await contract.deployTransaction.wait();
    
    console.log(`Oracle deployed to ${contract.address}`);

    console.log(`------ Add Oracle to Factory ---------`);
    const AuraFactory = await ethers.getContractFactory(`AuraFactory`);
    const f = AuraFactory.attach(FactoryAddress);
    let tx = await f.setOracle(contract.address, {gasLimit: 3000000});
    await tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
