/**
 * @dev Verify the deployed Multicall
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/multicall.js --network ropsten
 */

const { verifyMulticall } = require("./verifiers/verifiers")

async function main() {
    await verifyMulticall()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
