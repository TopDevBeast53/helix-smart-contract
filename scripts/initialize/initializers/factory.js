const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setOracleFactory } = require("../../shared/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const factoryAddress = contracts.factory[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]

const initializeFactory = async (wallet) => {
    print(`initialize the factory contract`)
    const factory = await loadContract(factoryAddress, wallet)
    await setOracleFactory(factory, oracleFactoryAddress)
}

module.exports = { initializeFactory }
