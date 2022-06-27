/* 
 * @dev Used to (re)connect all contract references to other contracts
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/0_connectAll.js --network ropsten
 */

const verbose = true

const { ethers } = require("hardhat");
const { 
    print, 
    connectFactory,
    initFeeMinter,
} = require("../shared/utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")
const initials = require("../constants/initials")

const factoryAddress = contracts.factory[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const helixVaultAddress = contracts.helixVault[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]

const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

const factoryName = "HelixFactory"
const feeMinterName = "FeeMinter"
const oracleFactoryName = "OracleFactory"

/// (Re)build any connections between contracts 
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectFactory(factoryName, factoryAddress, wallet, oracleFactoryAddress)

    const minters = [masterChefAddress, referralRegisterAddress, helixVaultAddress]
    await initFeeMinter(feeMinterName, feeMinterAddress, wallet, minters, toMintPercents)

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
