/**
 * @dev Verify the deployed Timelock
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/timelock.js --network ropsten
 */

const { verifyTimelock } = require("./verifiers/verifiers")

async function main() {
    await verifyTimelock()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
