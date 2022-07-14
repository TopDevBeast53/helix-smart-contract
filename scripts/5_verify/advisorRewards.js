/**
 * @dev Verify the deployed advisor rewards
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/advisorRewards.js --network ropsten
 */

const { verifyAdvisorRewards } = require("../shared/verify/verifiers")

async function main() {
    await verifyAdvisorRewards()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
