const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const deployLpSwap = async (deployer) => {
    print(`Deploy LP Swap`)

    const ContractFactory = await ethers.getContractFactory('LpSwap')
    const contract = await upgrades.deployProxy(ContractFactory, [])     
    await contract.deployTransaction.wait()
    print(`LP Swap deployed to ${contract.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        contract.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployLpSwap }
