const { ethers, upgrades } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const upgradeHelixChefNft = async (deployer) => {
    const chainId = await getChainId()
    const helixChefNftAddress = contracts.helixChefNFT[chainId]

    print(`upgrade Helix Chef NFT`)
    print(`helixChefNftAddress: ${helixChefNftAddress}`)

    const helixChefNftContractFactory = await ethers.getContractFactory(`HelixChefNFT`)
    const tx = await upgrades.upgradeProxy(helixChefNftAddress, helixChefNftContractFactory);
    await tx.deployed();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixChefNftAddress
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { upgradeHelixChefNft }
