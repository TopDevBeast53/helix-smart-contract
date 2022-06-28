const { ethers, upgrades } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const addresses = require("../../constants/addresses")

const helixTokenAddress = contracts.helixToken[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const treasuryAddress = addresses.TREASURY[env.network]

const deployAutoHelix = async (deployer) => {
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
