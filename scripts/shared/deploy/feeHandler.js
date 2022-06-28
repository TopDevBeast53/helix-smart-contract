const { ethers, upgrades } = require("hardhat")
const { print } = require("../utilities")

const addresses = require("../../constants/addresses")
const contracts = require("../../constants/contracts")
const env = require("../../constants/env")

const treasuryAddress = addresses.TREASURY[env.network]
const nftChefAddress = contracts.helixChefNFT[env.network]
const helixTokenAddress = contracts.helixToken[env.network]

const deployFeeHandler = async (deployer) => {
    print(`Deploy FeeHandler Proxy and Implementation`)
    print(`treasuryAddress: ${treasuryAddress}`)
    print(`nftChefAddress: ${nftChefAddress}`)
    print(`helixTokenAddress: ${helixTokenAddress}`)

    const FeeHandlerContractFactory = await ethers.getContractFactory("FeeHandler")

    // Deploy the fee handler proxy
    const feeHandlerProxy = await upgrades.deployProxy(
        FeeHandlerContractFactory, 
        [
            treasuryAddress, 
            nftChefAddress,
            helixTokenAddress
        ]
    ) 
    await feeHandlerProxy.deployTransaction.wait()
    print(`FeeHandler Proxy address: ${feeHandlerProxy.address}`)

    // Output the fee handler implementation address
    const feeHandlerImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        feeHandlerProxy.address
    )
    print(`FeeHandler Implementation address: ${feeHandlerImplementationAddress}`)
}

module.exports = { deployFeeHandler }
