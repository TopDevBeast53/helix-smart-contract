const { ethers, upgrades } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const addresses = require("../../../constants/addresses")


const deployAutoHelix = async (deployer) => {
    const chainId = await getChainId()
    const helixTokenAddress = contracts.helixToken[chainId]
    const masterChefAddress = contracts.masterChef[chainId]
    const treasuryAddress = contracts.treasuryMultiSig[chainId]

    print("deploy auto helix")
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`masterChefAddress: ${masterChefAddress}`)
    print(`treasuryAddress: ${treasuryAddress}`)

    const AutoHelix = await ethers.getContractFactory(`AutoHelix`)
    const autoHelix = await upgrades.deployProxy(AutoHelix, 
        [
            helixTokenAddress,
            masterChefAddress,
            treasuryAddress
        ]
    )

    await autoHelix.deployTransaction.wait()
    print(`AutoHelix deployed to ${autoHelix.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        autoHelix.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployAutoHelix }
