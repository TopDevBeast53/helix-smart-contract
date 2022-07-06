/* 
 * @dev Used to (re)build all required references for Referral Register
 * 
 * Run from project root using:
 *     npx hardhat run scripts/connect/referralRegister.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { connectReferralRegister } = require("./connectors/connectors")

async function main() {
    const [wallet] = await ethers.getSigners()
    await connectReferralRegister(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
