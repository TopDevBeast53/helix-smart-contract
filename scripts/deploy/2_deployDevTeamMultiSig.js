/*
 * @dev Deployment script devTeam multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/2_deployDevTeamMultiSig.js --network rinkeby
 */

const { ethers } = require(`hardhat`)
const env = require("../constnat
const initials = require("../constants/contracts")

const admins = initials.DEV_TEAM_MULTISIG_ADMINS[env.network]
const owners = initials.DEV_TEAM_MULTISIG_OWNERS[env.network]
const numAdminConfirmationsRequired = initials.DEV_TEAM_MULTISIG_NUM_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const numOwnerConfirmationsRequired = initials.DEV_TEAM_MULTISIG_NUM_OWNER_CONFIRMATIONS_REQUIRED[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log(`admins: ${admins}`)
    console.log(`owners: ${owners}`)
    console.log(`numAdminConfirmationsRequired ${numAdminConfirmationsRequired}`)
    console.log(`numOwnerConfirmationsRequired ${numOwnerConfirmationsRequired}`)

    console.log(`------ Start deploying devTeam multisig ---------`)
    const ContractFactory = await ethers.getContractFactory('TokenMultiSigWallet')
    const contract = await ContractFactory.deploy(
        admins,
        owners,
        numAdminConfirmationsRequired,
        numOwnerConfirmationsRequired,
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
