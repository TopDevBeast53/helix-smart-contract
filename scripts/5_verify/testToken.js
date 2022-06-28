/**
 * @dev Verify the deployed TestToken
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/testToken.js --network ropsten
 */

const { verifyTestToken } = require("../shared/verify/verifiers")

async function main() {
    await verifyTestToken()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
