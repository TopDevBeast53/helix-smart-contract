/**
 * deploy Helix Factory
 *
 * run from root:
 *      npx hardhat run scripts/deploy/8_deployFactory.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat")
const addresses = require("../constants/addresses")
const env = require("../constants/env")

const setterFeeOnPairSwaps = addresses.setterFeeOnPairSwaps[env.network]
const poolReceiveTradeFee = addresses.poolReceiveTradeFee[env.network]

async function main() {
    console.log(`Deploy HelixFactory Proxy and Implementation`)

    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    
    const Factory = await ethers.getContractFactory("HelixFactory")
    const factoryProxy = await upgrades.deployProxy(Factory, []) 
    await factoryProxy.deployTransaction.wait()
    console.log(`HelixFactory Proxy address: ${factoryProxy.address}`)

    const factoryImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        factoryProxy.address
    )
    console.log(`HelixFactory Implmentation address: ${factoryImplementationAddress}`)

    let INIT_CODE_HASH = await factoryProxy.INIT_CODE_HASH.call()
    console.log(`\nINIT_CODE_HASH: ${INIT_CODE_HASH}`)
    console.log("Don't forget to set INIT_CODE_HASH in HelixLibrary.sol and re-compile before continuing!\n")
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
