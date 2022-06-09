/*
 * deploy Router
 * 
 * run from root:
 *      npx hardhat run scripts/10_deployRouter.js --network rinkeby
 */

const hre  = require("hardhat")
const { ethers } = require("hardhat")
const env = require("./constants/env")

const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")

const factoryAddress = contracts.factory[env.network]
const wethAddress = addresses.WETH[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log(`factory address ${factoryAddress}`)
    console.log(`weth address ${wethAddress}`)

    console.log(`------ Deploy Router contract ---------`)
    const routerContractFactory = await ethers.getContractFactory("HelixRouterV1")
    const router = await routerContractFactory.deploy(factoryAddress, wethAddress)
    await router.deployTransaction.wait()
    console.log(`Router deployed to ${router.address}`)

    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
