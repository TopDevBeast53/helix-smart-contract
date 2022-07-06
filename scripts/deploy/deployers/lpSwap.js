const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const initials = require("../../constants/initials")

const feeHandlerAddress = contracts.feeHandler[env.network]
const collectorPercent = initials.LP_SWAP_COLLECTOR_PERCENT[env.network]

const deployLpSwap = async (deployer) => {
    print(`Deploy LP Swap`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    print(`collectorPercent: ${collectorPercent}`)

    const ContractFactory = await ethers.getContractFactory('LpSwap')
    const contract = await upgrades.deployProxy(ContractFactory, [
        feeHandlerAddress,
        collectorPercent
    ])     
    await contract.deployTransaction.wait()
    print(`LP Swap deployed to ${contract.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        contract.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployLpSwap }
