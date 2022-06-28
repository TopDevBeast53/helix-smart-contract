/**
 * @dev Verify the deployed DevTeamMultiSig
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/devTeamMultiSig.js --network ropsten
 */

const { verifyDevTeamMultiSig } = require("../shared/verify/verifiers")

async function main() {
    await verifyDevTeamMultiSig()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
