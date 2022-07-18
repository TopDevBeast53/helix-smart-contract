/**
 * @dev Verify the deployed AirDrop
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/airDrop.js --network ropsten
 */

const { verifyAirDrop } = require("./verifiers/verifiers")

async function main() {
    await verifyAirDrop()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
