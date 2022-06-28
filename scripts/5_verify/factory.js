/**
 * @dev Verify the deployed Factory
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/factory.js --network ropsten
 */

const { verifyFactory } = require("../shared/verify/verifiers")

async function main() {
    await verifyFactory()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
