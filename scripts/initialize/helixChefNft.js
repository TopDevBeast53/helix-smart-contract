/* 
 * @dev Used to (re)initialize Helix Chef Nft
 * 
 *     npx hardhat run scripts/initialize/helixChefNft.js --network
 */

const { ethers } = require(`hardhat`);
const { print } = require("../shared/utilities")
const { initializeHelixChefNft } = require("./initializers/initializers")

async function main() {
    const [wallet] = await ethers.getSigners()
    await initializeHelixChefNft(wallet)
    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
