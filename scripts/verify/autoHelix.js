/**
 * @dev Verify the deployed AutoHelix
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/autoHelix.js --network ropsten
 */

const { verifyAutoHelix } = require("../shared/verify/verifiers")

async function main() {
    await verifyAutoHelix()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
