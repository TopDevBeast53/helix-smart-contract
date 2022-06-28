/**
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/helixVault.js --network ropsten
 */

const { verifyHelixVault } = require("../shared/verify/verifiers")

async function main() {
    await verifyHelixVault()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
