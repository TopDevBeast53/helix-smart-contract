/**
 * @dev Verify the deployed paymentSplitter
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/verify/paymentSplitter.js --network
 */

const { verifyAirdropPaymentSplitter } = require("./verifiers/verifiers")

async function main() {
    await verifyAirdropPaymentSplitter()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
