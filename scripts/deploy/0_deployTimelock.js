/*
 * @dev Deployment script timelock contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deployTimelock.js --network rinkeby
 */

const { ethers } = require(`hardhat`)
const env = require("../constnat
const initials = require("../constants/contracts")

const minDelay = initials.TIMELOCK_MIN_DELAY[env.network]
const proposers = initials.TIMELOCK_PROPOSERS[env.network]
const executors = initials.TIMELOCK_EXECUTORS[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log(`minDelay ${minDelay}`)
    console.log(`proposers ${proposers}`)
    console.log(`executors ${executors}`)

    console.log(`------ Start deploying timelock ---------`)
    const ContractFactory = await ethers.getContractFactory('TimelockController')
    const contract = await ContractFactory.deploy(
        minDelay,
        proposers,
        executors
    )
    await contract.deployTransaction.wait()
    console.log(`owner multisig deployed to ${contract.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
