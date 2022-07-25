/**
 * @dev Verify the deployed TreasuryMultiSig
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/treasuryMultiSig.js --network ropsten
 */

const { verifyTreasuryMultiSig } = require("./verifiers/verifiers")

async function main() {
    await verifyTreasuryMultiSig()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
