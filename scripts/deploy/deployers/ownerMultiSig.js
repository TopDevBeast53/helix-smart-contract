const { ethers } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")

const deployOwnerMultiSig = async (deployer) => {
    const chainId = await getChainId()
    const admins = initials.OWNER_MULTISIG_ADMINS[chainId]
    const owners = initials.OWNER_MULTISIG_OWNERS[chainId]
    const adminConfirmationsRequired = initials.OWNER_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[chainId]
    const ownerConfirmationsRequired = initials.OWNER_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[chainId]

    print("deploy owner multisig")

    print(`admins: ${admins}`)
    print(`owners: ${owners}`)
    print(`adminConfirmationsRequired: ${adminConfirmationsRequired}`)
    print(`ownerConfirmationsRequired: ${ownerConfirmationsRequired}`)

    const contractFactory = await ethers.getContractFactory('MultiSigWallet')
    const contract = await contractFactory.deploy(
        admins,
        owners,
        adminConfirmationsRequired,
        ownerConfirmationsRequired
    )
    await contract.deployTransaction.wait()

    print(`deployed to ${contract.address}`)
}

module.exports = {
    deployOwnerMultiSig: deployOwnerMultiSig,
}
