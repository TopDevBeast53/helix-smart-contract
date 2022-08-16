const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const verifyDevTeamMultiSig = async () => {
    const chainId = await getChainId()
    const devTeamMultiSigAddress = contracts.devTeamMultiSig[chainId]
    const admins = initials.DEV_TEAM_MULTISIG_ADMINS[chainId]
    const owners = initials.DEV_TEAM_MULTISIG_OWNERS[chainId]
    const adminConfirmationsRequired = initials.DEV_TEAM_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[chainId]
    const ownerConfirmationsRequired = initials.DEV_TEAM_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[chainId]

    print("verify dev team multiSig")
    print(`devTeamMultiSigAddress: ${devTeamMultiSigAddress}`)
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
                ownerConfirmationsRequired
            ]
        }
    )
}

module.exports = { verifyDevTeamMultiSig }
