/**
 * @dev HelixFactory deployment script
 *
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/8_deployFactory.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat")
const addresses = require("./constants/addresses")
const env = require("./constants/env")

const setterFeeOnPairSwaps = addresses.setterFeeOnPairSwaps[env.network]
const poolReceiveTradeFee = addresses.poolReceiveTradeFee[env.network]

async function main() {
    console.log(`Deploy HelixFactory Proxy and Implementation`)

    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    
    const Factory = await ethers.getContractFactory("HelixFactory")
    const factoryProxy = await upgrades.deployProxy(Factory, [setterFeeOnPairSwaps]) 
    await factoryProxy.deployTransaction.wait()
    console.log(`HelixFactory Proxy address: ${factoryProxy.address}`)

    const factoryImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        factoryProxy.address
    )
    console.log(`HelixFactory Implmentation address: ${factoryImplementationAddress}`)

    let INIT_CODE_HASH = await factoryProxy.INIT_CODE_HASH.call()
    console.log(`INIT_CODE_HASH: ${INIT_CODE_HASH}`)

    await factoryProxy.setFeeTo(poolReceiveTradeFee)
    let feeTo = await factoryProxy.feeTo()
    console.log(`feeTo: ${feeTo}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
