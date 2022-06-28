/**
 * @dev Verify the deployed OracleFactory
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/oracleFactory.js --network ropsten
 */

const { verifyOracleFactory } = require("../shared/verify/verifiers")

async function main() {
    await verifyOracleFactory()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
