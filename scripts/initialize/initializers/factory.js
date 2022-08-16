const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { setOracleFactory } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const initializeFactory = async (wallet) => {
    const chainId = await getChainId()
    const factoryAddress = contracts.factory[chainId]
    const oracleFactoryAddress = contracts.oracleFactory[chainId]

    print(`initialize the factory contract`)
    const factory = await loadContract(factoryAddress, wallet)
    await setOracleFactory(factory, oracleFactoryAddress)
}

module.exports = { initializeFactory }
