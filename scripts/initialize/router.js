/* 
 * @dev Used to (re)build all required references for Router
 * 
 *     npx hardhat run scripts/initialize/router.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initializeRouter } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeRouter(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
