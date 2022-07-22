/**
 * @dev Verify the deployed MasterChef
 *
 * command for verify on testnet: 
 *      npx hardhat run scripts/5_verify/masterChef.js --network ropsten
 */

const { verifyMasterChef } = require("./verifiers/verifiers")

async function main() {
    await verifyMasterChef()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
