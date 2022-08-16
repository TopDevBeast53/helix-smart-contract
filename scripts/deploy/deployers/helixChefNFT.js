const { ethers, upgrades } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const deployHelixChefNft = async (deployer) => {
    const chainId = await getChainId()
    const rewardToken = contracts.helixToken[chainId];
    const helixNftAddress = contracts.helixNFT[chainId];

    print(`Deploy Upgradeable Helix Chef Nft`)
    print(`rewardToken: ${rewardToken}`)
    print(`helixNftAddress: ${helixNftAddress}`)

    const HelixChefNftFactory = await ethers.getContractFactory(`HelixChefNFT`)
    const helixChefNftProxy = await upgrades.deployProxy(
        HelixChefNftFactory, 
        [helixNftAddress, rewardToken]
    )
    await helixChefNftProxy.deployTransaction.wait()
    print(`Helix Chef Nft Proxy address: ${helixChefNftProxy.address}`)

    const helixChefNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixChefNftProxy.address
    )
    print(`Helix Chef Nft Implementation address: ${helixChefNftImplementationAddress}`)   
}

module.exports = { deployHelixChefNft } 
