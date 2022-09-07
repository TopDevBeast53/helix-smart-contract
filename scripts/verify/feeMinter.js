/**
 * @dev Verify the deployed FeeMinter
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/verifyFeeMinter.js --network ropsten
 */

const { verifyFeeMinter } = require("./verifiers/verifiers")

async function main() {
    await verifyFeeMinter()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
