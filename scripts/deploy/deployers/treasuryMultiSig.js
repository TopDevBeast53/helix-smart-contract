const { ethers } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")

const deployTreasuryMultiSig = async (deployer) => {
    const chainId = await getChainId()
    const admins = initials.TREASURY_MULTISIG_ADMINS[chainId]
    const owners = initials.TREASURY_MULTISIG_OWNERS[chainId]
    const adminConfirmationsRequired = initials.TREASURY_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[chainId]
    const ownerConfirmationsRequired = initials.TREASURY_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[chainId]

    print("deploy treasury multiSig") 
    print(`admins: ${admins}`)
    print(`owners: ${owners}`)
    print(`adminConfirmationsRequired: ${adminConfirmationsRequired}`)
    print(`ownerConfirmationsRequired: ${ownerConfirmationsRequired}`)

    const ContractFactory = await ethers.getContractFactory('MultiSigWallet')
    const contract = await ContractFactory.deploy(
        admins,
        owners,
        adminConfirmationsRequired,
        ownerConfirmationsRequired,
    )
    await contract.deployTransaction.wait()
    print(`treasury multisig deployed to ${contract.address}`)
}

module.exports = { deployTreasuryMultiSig }
