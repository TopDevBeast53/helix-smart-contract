const { ethers, network, upgrades } = require(`hardhat`)
const { print } = require("../utilities")

const deployHelixNft = async (deployer) => {
    print(`deploy upgradeable Helix NFT`)
   
    /*
    const helixNftFactory = await ethers.getContractFactory(`HelixNFT`)
    const helixNftProxy = await upgrades.deployProxy(helixNftFactory, [``])
    await helixNftProxy.deployTransaction.wait()
    print(`Helix NFT proxy address: ${helixNftProxy.address}`)

    const helixNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixNftProxy.address
    )
    print(`Helix NFT Implementation address: ${helixNftImplementationAddress}`)   
    */
}

module.exports = { deployHelixNft } 
