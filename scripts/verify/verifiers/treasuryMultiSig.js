const { run } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const verifyTreasuryMultiSig = async () => {
    const chainId = await getChainId()
    const treasuryMultiSigAddress = contracts.treasuryMultiSig[chainId]
    const admins = initials.TREASURY_MULTISIG_ADMINS[chainId]
    const owners = initials.TREASURY_MULTISIG_OWNERS[chainId]
    const adminConfirmationsRequired = initials.TREASURY_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[chainId]
    const ownerConfirmationsRequired = initials.TREASURY_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[chainId]

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
