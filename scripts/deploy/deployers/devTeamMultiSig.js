const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")

const deployDevTeamMultiSig = async (deployer) => {
    const chainId = await getChainId()
    const admins = initials.DEV_TEAM_MULTISIG_ADMINS[chainId]
    const owners = initials.DEV_TEAM_MULTISIG_OWNERS[chainId]
    const adminConfirmationsRequired = initials.DEV_TEAM_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[chainId]
    const ownerConfirmationsRequired = initials.DEV_TEAM_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[chainId]

    print("deploy dev team multiSig")
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
    print(`devTeam multiSig deployed to ${contract.address}`)
}

module.exports = { deployDevTeamMultiSig }
