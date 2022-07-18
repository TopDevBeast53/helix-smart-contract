/* 
 * @dev Used to (re)build all required references for Helix Nft
 * 
 *     npx hardhat run scripts/initialize/helixNft.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initializeHelixNft } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeHelixNft(wallet)
    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
