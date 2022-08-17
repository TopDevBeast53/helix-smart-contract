const { ethers } = require('hardhat')
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const deploySwapRewards = async (deployer) => {
    const chainId = await getChainId()
    const helixTokenAddress = contracts.helixToken[chainId]
    const oracleFactoryAddress = contracts.oracleFactory[chainId]
    const referralRegisterAddress = contracts.referralRegister[chainId]
    const routerAddress = contracts.router[chainId]

    print('Deploy SwapRewards')
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`oracleFactoryAddress: ${oracleFactoryAddress}`)
    print(`referralRegisterAddress: ${referralRegisterAddress}`)
    print(`routerAddress: ${routerAddress}`)

    const contractFactory = await ethers.getContractFactory('SwapRewards')
    const contract = await contractFactory.deploy(
        helixTokenAddress,
        oracleFactoryAddress,
        referralRegisterAddress,
        routerAddress
    )
    await contract.deployTransaction.wait()

    print(`swapRewards deployed to ${contract.address}`)
}

module.exports = { deploySwapRewards }
