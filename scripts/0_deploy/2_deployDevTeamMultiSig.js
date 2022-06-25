/*
 * @dev Deployment script devTeam multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/2_deployDevTeamMultiSig.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const env = require("../constants/env")
const initials = require("../constants/initials")

const admins = initials.DEV_TEAM_MULTISIG_ADMINS[env.network]
const owners = initials.DEV_TEAM_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.DEV_TEAM_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.DEV_TEAM_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log(`admins: ${admins}`)
    console.log(`owners: ${owners}`)
    console.log(`adminConfirmationsRequired ${adminConfirmationsRequired}`)
    console.log(`ownerConfirmationsRequired ${ownerConfirmationsRequired}`)

    console.log(`------ Start deploying devTeam multisig ---------`)
    const ContractFactory = await ethers.getContractFactory('TokenMultiSigWallet')
    const contract = await ContractFactory.deploy(
        admins,
        owners,
        adminConfirmationsRequired,
        ownerConfirmationsRequired,
        'dtp'   // dev token payments
    )
    await contract.deployTransaction.wait()
    console.log(`devTeam multisig deployed to ${contract.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
