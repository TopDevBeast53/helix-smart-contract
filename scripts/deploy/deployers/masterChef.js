/**
 * deploy Master Chef
 *
 * run from root:
 *      npx hardhat run scripts/deploy/17_deployMasterChef.js --network ropsten
 */

const { ethers, upgrades } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")
const addresses = require("../../../constants/addresses")
const initials = require("../../../constants/initials")

const helixTokenAddress = contracts.helixToken[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const developerAddress = contracts.devTeamMultiSig[env.network]
const startBlock = initials.MASTERCHEF_START_BLOCK[env.network]
const stakingPercent = initials.MASTERCHEF_STAKING_PERCENT[env.network]
const devPercent = initials.MASTERCHEF_DEV_PERCENT[env.network]

const deployMasterChef = async (deployer) => {
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
    // const chef = await upgrades.deployProxy(MasterChef, [
    //     helixTokenAddress,
    //     developerAddress,
    //     feeMinterAddress,
    //     startBlock,
    //     stakingPercent,
    //     devPercent,
    //     referralRegisterAddress
    // ])
    
    // await chef.deployTransaction.wait()
    // print(`Master Chef deployed to ${chef.address}`)

    // const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    //     chef.address
    // )
    // print(`Implementation address: ${implementationAddress}`)
    await upgrades.upgradeProxy('0x826c6b006Fb183dE41B8f0d16549505569083A14', MasterChef);
}

module.exports = { deployMasterChef }
