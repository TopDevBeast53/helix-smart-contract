const { run } = require("hardhat")
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")
const initials = require("../../../constants/initials")

const ownerMultiSigAddress = contracts.ownerMultiSig[env.network]

const admins = initials.OWNER_MULTISIG_ADMINS[env.network]
const owners = initials.OWNER_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.OWNER_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.OWNER_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

const verifyOwnerMultiSig = async () => {
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
