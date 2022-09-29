const { ethers } = require(`hardhat`)
const { getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')

const deploySynthReactor = async (deployer) => {
    const chainId = await getChainId()

    const helixTokenAddress = contracts.helixToken[chainId]
    const synthTokenAddress = contracts.synthToken[chainId]
    const nftChefAddress = contracts.helixChefNFT[chainId]

    console.log(`Deploy SynthReactor with args:`)
    console.log(`helixToken address:\t${helixTokenAddress}`)
    console.log(`synthToken address:\t${synthTokenAddress}`)
    console.log(`nftChef address:\t${nftChefAddress}`)

    const contractFactory = await ethers.getContractFactory('SynthReactor')
    const contractProxy = await upgrades.deployProxy(
        contractFactory,
        [
            helixTokenAddress,
            synthTokenAddress,
            nftChefAddress,
        ]
    )     
    await contractProxy.deployTransaction.wait()
   
    console.log("SynthReactor deployed:")
    console.log(`Proxy address:\t\t${contractProxy.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        contractProxy.address
    )
    console.log(`Implementation address:\t${implementationAddress}`)
}

module.exports = { deploySynthReactor }
