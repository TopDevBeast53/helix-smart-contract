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
    connectHelixChefNft,
    connectHelixNft,
} = require("../shared/utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")
const initials = require("../constants/initials")
const names = require("../constants/names")

const factoryAddress = contracts.factory[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const helixVaultAddress = contracts.helixVault[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const helixChefNftAddress = contracts.helixChefNFT[env.network]
const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const helixNftAddress = contracts.helixNFT[env.network]

const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

const factoryName = names.factoryAddress
const feeMinterName = names.feeMinterAddress
const oracleFactoryName = names.oracleFactoryAddress
const helixChefNftName = names.helixChefNftAddress
const helixNftName = names.helixNftAddress

/// (Re)build any connections between contracts 
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectFactory(factoryName, factoryAddress, wallet, oracleFactoryAddress)
    print("\n")

    const minters = [masterChefAddress, referralRegisterAddress, helixVaultAddress]
    await initFeeMinter(feeMinterName, feeMinterAddress, wallet, minters, toMintPercents)
    print("\n")

    await connectHelixChefNft(helixChefNftName, helixChefNftAddress, wallet, feeHandlerAddress)
    print("\n")

    await connectHelixNft(helixNftName, helixNftAddress, wallet, helixNftBridgeAddress, helixChefNftAddress)
    print("\n")

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
