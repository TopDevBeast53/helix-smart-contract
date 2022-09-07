const { run } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const verifyOwnerMultiSig = async () => {
    const chainId = await getChainId()
    const ownerMultiSigAddress = contracts.ownerMultiSig[chainId]
    const admins = initials.OWNER_MULTISIG_ADMINS[chainId]
    const owners = initials.OWNER_MULTISIG_OWNERS[chainId]
    const adminConfirmationsRequired = initials.OWNER_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[chainId]
    const ownerConfirmationsRequired = initials.OWNER_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[chainId]

    print("verify owner multisig")
    print(`ownerMultiSigAddress: ${ownerMultiSigAddress}`)
    print(`admins: ${admins}`)
    print(`owners: ${owners}`)
    print(`adminConfirmationsRequired: ${adminConfirmationsRequired}`)
    print(`ownerConfirmationsRequired: ${ownerConfirmationsRequired}`)

    await run(
        "verify:verify", {
            address: ownerMultiSigAddress,
            constructorArguments: [
                admins,
                owners,
                adminConfirmationsRequired,
                ownerConfirmationsRequired
            ]
        }
    )

}

module.exports = {
    verifyOwnerMultiSig: verifyOwnerMultiSig,
}
