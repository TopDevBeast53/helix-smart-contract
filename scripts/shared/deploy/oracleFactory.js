const { ethers, upgrades } = require(`hardhat`)
const { print } = require("../utilities")

const env = require('../../constants/env')
const contracts = require('../../constants/contracts')

const factoryAddress = contracts.factory[env.network]

const deployOracleFactory = async (deployer) => {
    print("deploy oracle factory")
    print(`factoryAddress: ${factoryAddress}`)

    /*
    const OracleFactory = await ethers.getContractFactory('OracleFactory')
    const oracleFactory = await upgrades.deployProxy(OracleFactory, [factoryAddress])
    await oracleFactory.deployTransaction.wait()
    
    print(`Oracle Factory proxy deployed to ${oracleFactory.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        oracleFactory.address
    )
    print(`Implementation address: ${implementationAddress}`)
    */
}

module.exports = { deployOracleFactory } 
