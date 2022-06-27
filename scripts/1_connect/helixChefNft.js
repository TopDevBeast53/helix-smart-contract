/* 
 * @dev Used to (re)initialize Helix Chef Nft
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/helixChefNft.js --network ropsten
 */

const verbose = true

const { ethers } = require(`hardhat`);
const { print, connectHelixChefNft } = require("../shared/utilities")

const env = require('./../constants/env')
const contracts = require('../constants/contracts')
const names = require("../constants/names")

const helixChefNftAddress = contracts.helixChefNFT[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]

const helixChefNftName = names.helixChefNftAddress

/// (Re)initialize this contract
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectHelixChefNft(helixChefNftName, helixChefNftAddress, wallet, feeHandlerAddress)

    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
