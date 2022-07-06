// This script exports the "connect" functions which are used to (re)build the connections between
// contracts

const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setOracleFactory } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../...constants/contracts')
const initials = require("../../../constants/initials")

const factoryAddress = contracts.factory[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]

const connectFactory = async (wallet) => {
    print(`(re)build any references the factory contract holds to other contracts`)
    const factory = await loadContract(factoryAddress, wallet)
    await setOracleFactory(factory, oracleFactoryAddress)
}

module.exports = { connectFactory }
