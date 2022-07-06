/* 
 * @dev Used to (re)build all required references for Helix Token
 * 
 * Run from project root using:
 *     npx hardhat run scripts/connect/helixToken.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { connectHelixToken } = require("./connectors/connectors")

async function main() {
    const [wallet] = await ethers.getSigners()
    await connectHelixToken(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
