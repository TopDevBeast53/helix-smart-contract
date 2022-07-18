const { ethers } = require("hardhat")
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")

const admins = initials.TREASURY_MULTISIG_ADMINS[env.network]
const owners = initials.TREASURY_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.TREASURY_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.TREASURY_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

const deployTreasuryMultiSig = async (deployer) => {
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
