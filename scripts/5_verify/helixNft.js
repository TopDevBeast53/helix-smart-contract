/**
 * @dev Verify the deployed HelixNft
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/helixNft.js --network ropsten
 */

const { verifyHelixNft } = require("../shared/verify/verifiers")

async function main() {
    await verifyHelixNft()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
