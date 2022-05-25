/**
 * @dev FeeHandler deployment script
 * 
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/deployFeeHandler.js --network testnetBSC
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/deployFeeHandler.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat")
const env = require("./constants/env")
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")

const treasury = addresses.setterFeeOnPairSwaps[env.network]
const nftChef = contracts.nftChef[env.network]

async function main() {
    console.log(`Deploy FeeHandler Proxy and Implementation`)

    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    
    const contractFactory = await ethers.getContractFactory("FeeHandler")
    const proxy = await upgrades.deployProxy(contractFactory, [treasury, nftChef]) 
    await proxy.deployTransaction.wait()
    console.log(`FeeHandler Proxy address: ${proxy.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        proxy.address
    )
    console.log(`FeeHandler Implementation address: ${implementationAddress}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
