const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const contracts = require("../../constants/contracts")
const env = require("../../constants/env")
const feeHandlerAddress = contracts.feeHandler[env.network]

const deployLpSwap = async (deployer) => {
    print(`Deploy LP Swap`)

    const ContractFactory = await ethers.getContractFactory('LpSwap')
    const contract = await upgrades.deployProxy(ContractFactory, [feeHandlerAddress])     
    await contract.deployTransaction.wait()
    print(`LP Swap deployed to ${contract.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        contract.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployLpSwap }
