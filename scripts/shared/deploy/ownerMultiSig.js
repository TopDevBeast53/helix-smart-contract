const { ethers } = require("hardhat")
const { print } = require("../utilities")

const env = require("../../constants/env")
const initials = require("../../constants/initials")

const admins = initials.OWNER_MULTISIG_ADMINS[env.network]
const owners = initials.OWNER_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.OWNER_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.OWNER_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

const deployOwnerMultiSig = async (deployer) => {
    print("deploy owner multisig")

    print(`admins: ${admins}`)
    print(`owners: ${owners}`)
    print(`adminConfirmationsRequired: ${adminConfirmationsRequired}`)
    print(`ownerConfirmationsRequired: ${ownerConfirmationsRequired}`)

    /*
    const contractFactory = await ethers.getContractFactory('MultiSigWallet')
    const contract = await ContractFactory.deploy(
        admins,
        owners,
        adminConfirmationsRequired,
        ownerConfirmationsRequired
    )
    await contract.deployTransaction.wait()

    print(`deployed to ${contract.address}`)
    */
}

module.exports = {
    deployOwnerMultiSig: deployOwnerMultiSig,
}
