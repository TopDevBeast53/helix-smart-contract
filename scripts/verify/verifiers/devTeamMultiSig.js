const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const devTeamMultiSigAddress = contracts.devTeamMultiSig[env.network]

const admins = initials.DEV_TEAM_MULTISIG_ADMINS[env.network]
const owners = initials.DEV_TEAM_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.DEV_TEAM_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.DEV_TEAM_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

const verifyDevTeamMultiSig = async () => {
    print("verify dev team multiSig")
    print(`admins: ${admins}`)
    print(`owners: ${owners}`)
    print(`adminConfirmationsRequired: ${adminConfirmationsRequired}`)
    print(`ownerConfirmationsRequired: ${ownerConfirmationsRequired}`)

    await run(
        "verify:verify", {
            address: devTeamMultiSigAddress,
            constructorArguments: [
                admins,
                owners,
                adminConfirmationsRequired,
                ownerConfirmationsRequired,
                'dtp'   // dev token payments
            ]
        }
    )
}

module.exports = { verifyDevTeamMultiSig }
