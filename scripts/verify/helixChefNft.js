/**
 * @dev Verify the deployed HelixChefNft
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/helixChefNft.js --network ropsten
 */

const { verifyHelixChefNft } = require("../shared/verify/verifiers")

async function main() {
    await verifyHelixChefNft()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
