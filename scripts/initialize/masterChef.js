/* 
 * @dev Used to (re)build all required references for Master Chef
 * 
 *     npx hardhat run scripts/initialize/masterChef.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initializeMasterChef } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeMasterChef(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
