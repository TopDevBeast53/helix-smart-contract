/**
 * @dev Verify the deployed SwapRewards
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/swapRewards.js --network ropsten
 */

const { verifySwapRewards } = require("./verifiers/verifiers")

async function main() {
    await verifySwapRewards()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
