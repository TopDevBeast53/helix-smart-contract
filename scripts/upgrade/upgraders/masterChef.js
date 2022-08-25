const { ethers, upgrades } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const upgradeMasterChef = async (deployer) => {
    const chainId = await getChainId()
    const masterChefAddress = contracts.masterChef[chainId]

    print(`upgrade Master Chef`)
    print(`masterChefAddress: ${masterChefAddress}`)

    const masterChefContractFactory = await ethers.getContractFactory(`MasterChef`)
    const tx = await upgrades.upgradeProxy(masterChefAddress, masterChefContractFactory);
    await tx.deployed();
}

module.exports = { upgradeMasterChef }
