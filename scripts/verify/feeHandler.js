/**
 * @dev Verify the deployed FeeHandler
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/feeHandler.js --network ropsten
 */

const { verifyFeeHandler } = require("./verifiers/verifiers")

async function main() {
    await verifyFeeHandler()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
