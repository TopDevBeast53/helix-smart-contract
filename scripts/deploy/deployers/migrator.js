const { ethers } = require('hardhat');
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const deployMigrator = async (deployer) => {
    const chainId = await getChainId() 
    const routerAddress = contracts.router[chainId];

    print('Deploy Migrator');
    print(`routerAddress: ${routerAddress}`)

    const Migrator = await ethers.getContractFactory('HelixMigrator');
    const migrator = await Migrator.deploy(routerAddress);
    await migrator.deployTransaction.wait();

    print(`HelixMigrator deployed to ${migrator.address}`);
}

module.exports = { deployMigrator }
