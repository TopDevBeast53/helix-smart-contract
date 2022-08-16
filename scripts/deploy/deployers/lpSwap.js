const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const deployLpSwap = async (deployer) => {
    const chainId = await getChainId()
    const feeHandlerAddress = contracts.feeHandler[chainId]
    const collectorPercent = initials.LP_SWAP_COLLECTOR_PERCENT[chainId]

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
