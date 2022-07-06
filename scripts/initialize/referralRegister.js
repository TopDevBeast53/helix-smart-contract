/* 
 * @dev Used to (re)build all required references for Referral Register
 * 
 *     npx hardhat run scripts/initialize/referralRegister.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initializeReferralRegister } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeReferralRegister(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
