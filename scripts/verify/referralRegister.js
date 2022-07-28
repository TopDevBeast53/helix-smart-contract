/**
 * @dev Verify the deployed ReferralRegister
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/referralRegister.js --network ropsten
 */

const { verifyReferralRegister } = require("./verifiers/verifiers")

async function main() {
    await verifyReferralRegister()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
