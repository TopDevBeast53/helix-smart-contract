/**
 * @dev Verify the deployed Router
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/router.js --network ropsten
 */

const { verifyRouter } = require("../shared/verify/verifiers")

async function main() {
    await verifyRouter()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
