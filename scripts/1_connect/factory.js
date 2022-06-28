/* 
 * @dev Used to (re)build all required references for Helix Factory
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/factory.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { print } = require("../shared/utilities")
const { connectFactory } = require("../shared/connect")

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
