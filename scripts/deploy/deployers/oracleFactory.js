const { ethers, upgrades } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')

const deployOracleFactory = async (deployer) => {
    const chainId = await getChainId()
    const factoryAddress = contracts.factory[chainId]

    print("deploy oracle factory")
    print(`factoryAddress: ${factoryAddress}`)

    const OracleFactory = await ethers.getContractFactory('OracleFactory')
    const oracleFactory = await upgrades.deployProxy(OracleFactory, [factoryAddress])
    await oracleFactory.deployTransaction.wait()
    
    print(`Oracle Factory proxy deployed to ${oracleFactory.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        oracleFactory.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployOracleFactory } 
