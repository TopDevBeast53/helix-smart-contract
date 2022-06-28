/* 
 * @dev Used to (re)build all required references for Router
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/router.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { connectRouter } = require("../shared/connect")

async function main() {
    const [wallet] = await ethers.getSigners()
    await connectRouter(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
