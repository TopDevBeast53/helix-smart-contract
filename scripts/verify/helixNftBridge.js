/**
 * @dev Verify the deployed HelixNftBridge
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/helixNftBridge.js --network rinkeby
 */

const { verifyHelixNftBridge } = require("../shared/verify/verifiers")

async function main() {
    await verifyHelixNftBridge()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
