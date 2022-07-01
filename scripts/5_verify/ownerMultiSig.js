/**
 * @dev Verify the deployed Migrator contract
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/verifyMigrator.js --network ropsten
 */

const { verifyOwnerMultiSig } = require("../shared/verify/verifiers")

async function main() {
    await verifyOwnerMultiSig()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
