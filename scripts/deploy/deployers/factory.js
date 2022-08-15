const { ethers, upgrades } = require("hardhat")
const { print } = require("../../shared/utilities")

const deployFactory = async (deployer) => {
    print(`Deploy HelixFactory Proxy and Implementation`)

    const Factory = await ethers.getContractFactory("HelixFactory")
    const factoryProxy = await upgrades.deployProxy(Factory, []) 
    await factoryProxy.deployTransaction.wait()
    print(`HelixFactory Proxy address: ${factoryProxy.address}`)

    const factoryImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        factoryProxy.address
    )
    print(`HelixFactory Implmentation address: ${factoryImplementationAddress}`)

    let INIT_CODE_HASH = await factoryProxy.INIT_CODE_HASH.call()
    print(`\nINIT_CODE_HASH: ${INIT_CODE_HASH}`)
    print("Don't forget to set INIT_CODE_HASH in HelixLibrary.sol and re-compile before continuing!\n")
}

module.exports = { deployFactory } 
