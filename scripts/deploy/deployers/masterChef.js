const { ethers, upgrades } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const addresses = require("../../../constants/addresses")
const initials = require("../../../constants/initials")

const deployMasterChef = async (deployer) => {
    const chainId = await getChainId()
    const helixTokenAddress = contracts.helixToken[chainId]
    const referralRegisterAddress = contracts.referralRegister[chainId]
    const feeMinterAddress = contracts.feeMinter[chainId]
    const developerAddress = contracts.devTeamMultiSig[chainId]
    const startBlock = initials.MASTERCHEF_START_BLOCK[chainId]
    const stakingPercent = initials.MASTERCHEF_STAKING_PERCENT[chainId]
    const devPercent = initials.MASTERCHEF_DEV_PERCENT[chainId]

    if (devPercent + stakingPercent != 1000000) {
        print('devPercent + stakingPercent != 1000000')
        return
    }

    print(`deploy Master Chef`)
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`referralRegisterAddress: ${referralRegisterAddress}`)
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`developerAddress: ${developerAddress}`)
    print(`startBlock: ${startBlock}`)
    print(`stakingPercent: ${stakingPercent}`)
    print(`devPercent: ${devPercent}`)

    const MasterChef = await ethers.getContractFactory(`MasterChef`)
    const chef = await upgrades.deployProxy(MasterChef, [
        helixTokenAddress,
        developerAddress,
        feeMinterAddress,
        startBlock,
        stakingPercent,
        devPercent,
        referralRegisterAddress
    ])

    await chef.deployTransaction.wait()
    print(`Master Chef deployed to ${chef.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        chef.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployMasterChef }
