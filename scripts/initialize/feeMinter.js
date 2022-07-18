/* 
 * @dev Used to (re)initialize feeMinter state
 * 
 *     npx hardhat run scripts/initialize/feeMinter.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initializeFeeMinter } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeFeeMinter(wallet)
    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
