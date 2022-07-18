/**
 * @dev Verify the deployed Migrator
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/migrator.js --network ropsten
 */

const { verifyMigrator } = require("../shared/verify/verifiers")

async function main() {
    await verifyMigrator()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
