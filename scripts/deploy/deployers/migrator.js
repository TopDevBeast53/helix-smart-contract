const { ethers } = require('hardhat');
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const routerAddress = contracts.router[env.network];

const deployMigrator = async (deployer) => {
    print('Deploy Migrator');
    print(`routerAddress: ${routerAddress}`)

    const Migrator = await ethers.getContractFactory('HelixMigrator');
    const migrator = await Migrator.deploy(routerAddress);
    await migrator.deployTransaction.wait();

    print(`HelixMigrator deployed to ${migrator.address}`);
}

module.exports = { deployMigrator }
