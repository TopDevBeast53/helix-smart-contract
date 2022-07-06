/* 
 * @dev Used to (re)build all required references for Master Chef
 * 
 * Run from project root using:
 *     npx hardhat run scripts/connect/masterChef.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { connectMasterChef, initializeMasterChef } = require("./connectors/connectors")

async function main() {
    const [wallet] = await ethers.getSigners()
    await connectMasterChef(wallet)
    await initializeMasterChef(wallet)
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
