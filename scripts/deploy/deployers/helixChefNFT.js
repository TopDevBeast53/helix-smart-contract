const { ethers, upgrades } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const deployHelixChefNft = async (deployer) => {
    const chainId = await getChainId()
    const helixNftAddress = contracts.helixNFT[chainId];
    const helixTokenAddress = contracts.helixToken[chainId];
    const feeMinterAddress = contracts.feeMinter[chainId];

    print(`Deploy Upgradeable Helix Chef Nft`)
    print(`helixNft Address: ${helixNftAddress}`)
    print(`helixToken Address: ${helixTokenAddress}`)
    print(`feeMinter Address: ${feeMinterAddress}`)

    const HelixChefNftFactory = await ethers.getContractFactory(`HelixChefNFT`)
    const helixChefNftProxy = await upgrades.deployProxy(
        HelixChefNftFactory, 
        [
            helixNftAddress, 
            helixTokenAddress,
            feeMinterAddress,
        ]
    )
    await helixChefNftProxy.deployTransaction.wait()
    print(`Helix Chef Nft Proxy address: ${helixChefNftProxy.address}`)

    const helixChefNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixChefNftProxy.address
    )
    print(`Helix Chef Nft Implementation address: ${helixChefNftImplementationAddress}`)   
}

module.exports = { deployHelixChefNft } 
