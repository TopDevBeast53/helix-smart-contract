const { run } = require("hardhat")
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const treasuryMultiSigAddress = contracts.treasuryMultiSig[env.network]

const admins = initials.TREASURY_MULTISIG_ADMINS[env.network]
const owners = initials.TREASURY_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.TREASURY_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.TREASURY_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

const verifyTreasuryMultiSig = async () => {
    print("verify treasury multiSig") 
    print(`treasuryMultiSigAddress: ${treasuryMultiSigAddress}`)
    print(`admins: ${admins}`)
    print(`owners: ${owners}`)
    print(`adminConfirmationsRequired: ${adminConfirmationsRequired}`)
    print(`ownerConfirmationsRequired: ${ownerConfirmationsRequired}`)
    
    await run(
        "verify:verify", {
            address: treasuryMultiSigAddress,
            constructorArguments: [
                admins,
                owners,
                adminConfirmationsRequired,
                ownerConfirmationsRequired
            ]
        }
    )
}

module.exports = { verifyTreasuryMultiSig }
