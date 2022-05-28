/**
 * @dev FeeHandler deployment script
 * 
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/deployFeeHandler.js --network testnetBSC
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/deployFeeHandler.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat")
const addresses = require("./constants/addresses")
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const treasuryAddress = addresses.TREASURY[env.network]
const nftChefAddress = contracts.helixChefNFT[env.network]

async function main() {
    console.log(`Deploy FeeHandler Proxy and Implementation`)

    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    
    const FeeHandlerContractFactory = await ethers.getContractFactory("FeeHandler")

    // Deploy the fee handler proxy
    const feeHandlerProxy = await upgrades.deployProxy(
        FeeHandlerContractFactory, 
        [
            treasuryAddress, 
            nftChefAddress
        ]
    ) 
    await feeHandlerProxy.deployTransaction.wait()
    console.log(`FeeHandler Proxy address: ${factoryProxy.address}`)

    // Output the fee handler implementation address
    const feeHandlerImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        feeHandlerProxy.address
    )
    console.log(`FeeHandler Implementation address: ${feeHandlerImplementationAddress}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
