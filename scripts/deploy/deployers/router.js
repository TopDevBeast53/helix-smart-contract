const { ethers } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const addresses = require("../../../constants/addresses")

const deployRouter = async (deployer) => {
    const chainId = await getChainId()
    const factoryAddress = contracts.factory[chainId]
    const wethAddress = addresses.WETH[chainId]

    print("deploy router")
    print(`factory address: ${factoryAddress}`)
    print(`weth address: ${wethAddress}`)

    const routerContractFactory = await ethers.getContractFactory("HelixRouterV1")
    const router = await routerContractFactory.deploy(factoryAddress, wethAddress)
    await router.deployTransaction.wait()
    print(`Router deployed to ${router.address}`)
}

module.exports = { deployRouter }
