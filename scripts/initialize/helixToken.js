/* 
 * @dev Used to (re)build all required references for Helix Token
 * 
 *     npx hardhat run scripts/initialize/helixToken.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initializeHelixToken } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeHelixToken(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
