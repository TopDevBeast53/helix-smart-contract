/* 
 * @dev Used to (re)initialize feeMinter state
 * 
 * Run from project root using:
 *     npx hardhat run scripts/connect/feeMinter.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initFeeMinter } = require("./connectors/connectors")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initFeeMinter(wallet)
    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
