/**
 * @dev Verify the deployed helix token
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/verifyHelixToken.js --network ropsten
 */

const { verifyHelixToken } = require("../shared/verify/verifiers")

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
