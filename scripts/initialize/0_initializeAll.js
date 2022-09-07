/* 
 * @dev Used to (re)initialize all contract references to other contracts
 * 
 * Run from project root using:
 *     npx hardhat run scripts/initialize/0_initializeAll.js --network
 */

const { ethers } = require("hardhat");
const { print } = require("../shared/utilities")
const { initializeFactory } = require("./initializers/factory")
const { initializeFeeMinter } = require("./initializers/feeMinter")
const { initializeHelixChefNft } = require("./initializers/helixChefNft")
const { initializeHelixNft } = require("./initializers/helixNft")
const { initializeHelixToken } = require("./initializers/helixToken")
// const { initializeMasterChef } = require("./initializers/masterChef")
const { initializeReferralRegister } = require("./initializers/referralRegister")
const { initializeRouter } = require("./initializers/router")

async function main() {
    const [wallet] = await ethers.getSigners()

    await initializeFactory(wallet)
    print("\n")

    await initializeFeeMinter(wallet)
    print("\n")

    await initializeHelixChefNft(wallet)
    print("\n")

    await initializeHelixNft(wallet)
    print("\n")

    await initializeHelixToken(wallet)
    print("\n")

    // await initializeMasterChef(wallet)
    // print("\n")

    await initializeReferralRegister(wallet)
    print("\n")

    await initializeRouter(wallet)
    print("\n")

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
