const { ethers, upgrades } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const masterChefAddress = contracts.masterChef[env.network]

const upgradeMasterChef = async (deployer) => {
    print(`upgrade Master Chef`)
    print(`masterChefAddress: ${masterChefAddress}`)

    const masterChefContractFactory = await ethers.getContractFactory(`MasterChef`)
    const tx = await upgrades.upgradeProxy(masterChefAddress, masterChefContractFactory);
    await tx.deployed();
}

module.exports = { upgradeMasterChef }
