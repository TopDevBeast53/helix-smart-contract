/* 
 * @dev Used to (re)connect all contract references to other contracts
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/0_connectAll.js --network ropsten
 */

const verbose = true

const { ethers } = require("hardhat");
const { print } = require("../shared/utilities")
const { connectFactory } = require("./factory")
const { connectFeeMinter } = require("./feeMinter")

/// (Re)build any connections between contracts 
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectFactory(wallet)
    // await connectFeeMinter(wallet)

    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
