/* 
 * @dev Used to (re)build all required references for Referral Register
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/referralRegister.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print, connectReferralRegister } = require("../shared/utilities")

const env = require("./../constants/env")
const contracts = require("./../constants/contracts")
const names = require("./../constants/names")

const referralRegisterAddress = contracts.referralRegister[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]
const masterChefAddress = contracts.masterChef[env.network]

const referralRegisterName = names.referralRegisterAddress

/// (Re)build any connections by calling this script"s contract"s setters
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectReferralRegister(
        referralRegisterName,
        referralRegisterAddress,
        wallet,
        swapRewardsAddress,
        masterChefAddress
    )

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
