/*
 * @dev Deployment script treasury multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/1_deployTreasuryMultiSig.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const env = require("../constants/env")
const initials = require("../constants/initials")

const admins = initials.TREASURY_MULTISIG_ADMINS[env.network]
const owners = initials.TREASURY_MULTISIG_OWNERS[env.network]
const adminConfirmationsRequired = initials.TREASURY_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED[env.network]
const ownerConfirmationsRequired = initials.TREASURY_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log(`admins: ${admins}`)
    console.log(`owners: ${owners}`)
    console.log(`adminConfirmationsRequired ${adminConfirmationsRequired}`)
    console.log(`ownerConfirmationsRequired ${ownerConfirmationsRequired}`)

    console.log(`------ Start deploying treasury multisig ---------`)
    const ContractFactory = await ethers.getContractFactory('TokenMultiSigWallet')
    const contract = await ContractFactory.deploy(
        admins,
        owners,
        adminConfirmationsRequired,
        ownerConfirmationsRequired,
        'ht'    // helix treasury
    )
    await contract.deployTransaction.wait()
    console.log(`treasury multisig deployed to ${contract.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
