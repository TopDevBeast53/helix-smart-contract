const { ethers } = require("hardhat")
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")
const addresses = require("../../../constants/addresses")

const factoryAddress = contracts.factory[env.network]
const wethAddress = addresses.WETH[env.network]

const deployRouter = async (deployer) => {
    print("deploy router")
    print(`factory address: ${factoryAddress}`)
    print(`weth address: ${wethAddress}`)

    const routerContractFactory = await ethers.getContractFactory("HelixRouterV1")
    const router = await routerContractFactory.deploy(factoryAddress, wethAddress)
    await router.deployTransaction.wait()
    print(`Router deployed to ${router.address}`)
}

module.exports = { deployRouter }
