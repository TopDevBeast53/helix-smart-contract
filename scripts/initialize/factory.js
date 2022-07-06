/* 
 * @dev Used to (re)build all required references for Helix Factory
 * 
 *     npx hardhat run scripts/initialize/factory.js --network
 */

const { ethers } = require(`hardhat`)
const { print } = require("../shared/utilities")
const { initializeFactory } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeFactory(wallet)
    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
