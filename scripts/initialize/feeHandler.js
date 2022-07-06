/**
 * @dev Used to (re)build all required references and settings for fee handler
 * 
 *      npx hardhat run scripts/initialize/feeHandler.js --network
 */

const { ethers } = require("hardhat")
const { print } = require("../shared/utilities")
const { initializeFeeHandler } = require("../initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    initializeFeeHandler(wallet)
    print("done")
}    

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 
