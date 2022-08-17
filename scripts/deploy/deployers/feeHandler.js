const { ethers, upgrades } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const addresses = require("../../../constants/addresses")
const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const deployFeeHandler = async (deployer) => {
    const chainId = await getChainId()
    const treasuryAddress = contracts.treasuryMultiSig[chainId]
    const nftChefAddress = contracts.helixChefNFT[chainId]
    const helixTokenAddress = contracts.helixToken[chainId]
    const defaultNftChefPercent = initials.FEE_HANDLER_DEFAULT_NFT_CHEF_PERCENT[chainId]

    print(`Deploy FeeHandler Proxy and Implementation`)
    print(`treasuryAddress: ${treasuryAddress}`)
    print(`nftChefAddress: ${nftChefAddress}`)
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`defaultNftChefPercent: ${defaultNftChefPercent}`)

    const FeeHandlerContractFactory = await ethers.getContractFactory("FeeHandler")

    // Deploy the fee handler proxy
    const feeHandlerProxy = await upgrades.deployProxy(
        FeeHandlerContractFactory, 
        [
            treasuryAddress, 
            nftChefAddress,
            helixTokenAddress,
            defaultNftChefPercent
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
