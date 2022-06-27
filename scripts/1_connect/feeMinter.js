/* 
 * @dev Used to (re)initialize feeMinter state
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/feeMinter.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print, initFeeMinter } = require("../shared/utilities")

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

    const minters = [masterChefAddress, referralRegisterAddress, helixVaultAddress]
    await initFeeMinter(feeMinterName, feeMinterAddress, wallet, minters, toMintPercents)

    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
