/* 
 * @dev Used to (re)build all required references for Helix Nft
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/helixNft.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print, loadContract, addMinter, addStaker } = require("../shared/utilities")

const env = require('./../constants/env')

const contracts = require("../constants/contracts")
const names = require("../constants/names")

const helixNftAddress = contracts.helixNFT[env.network]
const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]
const helixChefNftAddress = contracts.helixChefNFT[env.network]

const helixNftName = names.helixNftAddress

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    const [wallet] = await ethers.getSigners()
    
    const helixNft = await loadContract(helixNftName, helixNftAddress, wallet)

    await addMinter(helixNft, helixNftName, helixNftBridgeAddress)
    await addStaker(helixNft, helixNftName, helixChefNftAddress)

    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
