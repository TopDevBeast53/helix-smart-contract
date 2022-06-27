/* 
 * @dev Used to (re)build all required references for Fee Minter
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/feeMinter.js --network ropsten
 */

const verbose = true

const { ethers } = require(`hardhat`);
const { print, loadContract, setToMintPercents } = require("../shared/utilities")

const env = require('./../constants/env')
const contracts = require('./../constants/contracts')
const initials = require('./../constants/initials')

const feeMinterAddress = contracts.feeMinter[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const helixVaultAddress = contracts.helixVault[env.network]
const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

const feeMinterName = 'FeeMinter'

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    const [wallet] = await ethers.getSigners()
    await connectFeeMinter(wallet)
    print('done')
}

async function connectFeeMinter(wallet) {
    const feeMinter = await loadContract(feeMinterName, feeMinterAddress, wallet)
    let minters = [masterChefAddress, referralRegisterAddress, helixVaultAddress]
    await setToMintPercents(feeMinter, feeMinterName, minters, toMintPercents)
}

module.exports.connectFeeMinter = async (wallet) => {
    await connectFeeMinter(wallet)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
