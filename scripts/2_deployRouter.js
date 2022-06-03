/*
 * @dev Router Deployment script
 * 
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/2_deployRouter.js --network testnetBSC
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/2_deployRouter.js --network rinkeby
 */

const hre  = require("hardhat")
const { ethers } = require("hardhat")
const env = require("./constants/env")

const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const externalContracts = require("./constants/externalContracts")

const factoryAddress = externalContracts.factory[env.network]
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

    // Wait for contract to be accessible
    /*
    setTimeout(async () => {
        console.log(`------ Verify Router contract ---------`)
        await hre.run(
            "verify:verify", { 
                address: router.address, 
                constructorArguments: [
                    factoryAddress,
                    wethAddress
                ]   
            }   
        )
        console.log(`Router verified`)
    }, 500);
    */

    console.log(`Done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
