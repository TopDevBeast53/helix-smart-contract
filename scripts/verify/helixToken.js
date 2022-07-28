/**
 * @dev Verify the deployed HelixToken
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/verify/helixToken.js --network ropsten
 */

const { verifyHelixToken } = require("./verifiers/verifiers")

async function main() {
    await verifyHelixToken()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
