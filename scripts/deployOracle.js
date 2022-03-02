/*
 * @dev Deployment script for Oracle contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deployOracle.js --network testnetBSC
 */

// Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654

const { ethers } = require(`hardhat`);

const contracts = require('./constants/contracts');
const env = require('./constants/env');

// const FactoryAddress = '0x84f22547020f582Deef1eb1B57b3b213D5997471';
const FactoryAddress = contracts.factory[env.network];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Oracle`);
    const ContractFactory = await ethers.getContractFactory('Oracle');
    const contract = await ContractFactory.deploy(FactoryAddress, 48, 24, { gasLimit: 3000000 });
    await contract.deployTransaction.wait();
    
    console.log(`Oracle deployed to ${contract.address}`);
    console.log('Done');

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
