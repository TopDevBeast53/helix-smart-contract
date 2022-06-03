/**
 * @dev Verify the deployed Migrator contract
 *
 * command for verify on testnet: 
 * 
 *      npx hardhat run scripts/verifyMigrator.js --network rinkeby
 */

const hre = require("hardhat")
const { ethers } = require("hardhat")
const env = require("./constants/env")

const contracts = require("./constants/contracts")
const initials = require("./constants/initials")

const migratorAddress = contracts.helixMigrator[env.network]
const routerAddress = contracts.router[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log(`Verify Migrator contract`)
    console.log(`migrator address ${migratorAddress}`)
    console.log(`router address ${routerAddress}`)
    await hre.run(
        "verify:verify", {
            address: migratorAddress,
            constructorArguments: [routerAddress]
        }
    )
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
