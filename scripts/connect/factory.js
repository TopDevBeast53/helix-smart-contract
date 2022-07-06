/* 
 * @dev Used to (re)build all required references for Helix Factory
 * 
 * Run from project root using:
 *     npx hardhat run scripts/connect/factory.js --network
 */

const { ethers } = require(`hardhat`)
const { print } = require("../shared/utilities")
const { connectFactory } = require("./connectors/connectors")

async function main() {
    const [wallet] = await ethers.getSigners()
    await connectFactory(wallet)
    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
