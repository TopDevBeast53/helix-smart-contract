const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const initials = require("../../constants/initials")

const admins = initials.DEV_TEAM_MULTISIG_ADMINS[env.network]
const owners = initials.DEV_TEAM_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.DEV_TEAM_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.DEV_TEAM_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

const deployDevTeamMultiSig = async (deployer) => {
    print("deploy dev team multiSig")
    print(`admins: ${admins}`)
    print(`owners: ${owners}`)
    print(`adminConfirmationsRequired: ${adminConfirmationsRequired}`)
    print(`ownerConfirmationsRequired: ${ownerConfirmationsRequired}`)

    const ContractFactory = await ethers.getContractFactory('TokenMultiSigWallet')
    const contract = await ContractFactory.deploy(
        admins,
        owners,
        adminConfirmationsRequired,
        ownerConfirmationsRequired,
        'dtp'   // dev token payments
    )
    await contract.deployTransaction.wait()
    print(`devTeam multiSig deployed to ${contract.address}`)
}

module.exports = { deployDevTeamMultiSig }
