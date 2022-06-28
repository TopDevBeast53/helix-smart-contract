/* 
 * @dev Used to (re)connect all contract references to other contracts
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/0_connectAll.js --network ropsten
 */

const verbose = true

const { ethers } = require("hardhat");
const { print } = require("../shared/utilities")
const {
    connectFactory,
    initFeeMinter,
    connectHelixChefNft,
    connectHelixNft,
    connectHelixToken,
    connectMasterChef,
    connectReferralRegister,
    connectRouter,
} = require("../shared/connect")

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
const helixTokenAddress = contracts.helixToken[env.network]
const vaultAddress = contracts.helixVault[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]
const routerAddress = contracts.router[env.network]

const factoryName = names.factoryAddress
const feeMinterName = names.feeMinterAddress
const oracleFactoryName = names.oracleFactoryAddress
const helixChefNftName = names.helixChefNftAddress
const helixNftName = names.helixNftAddress
const helixTokenName = names.helixTokenAddress
const masterChefName = names.masterChefAddress
const referralRegisterName = names.referralRegisterAddress
const routerName = names.routerAddress

const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

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

    await connectHelixNft(
        helixNftName, 
        helixNftAddress, 
        wallet, 
        helixNftBridgeAddress, 
        helixChefNftAddress
    )
    print("\n")

    await connectHelixToken(
        helixTokenName, 
        helixTokenAddress, 
        wallet, 
        referralRegisterAddress,
        vaultAddress,
        masterChefAddress
    )
    print("\n")

    await connectMasterChef(masterChefName, masterChefAddress, wallet, referralRegisterAddress)
    print("\n")

    await connectReferralRegister(
        referralRegisterName,
        referralRegisterAddress, 
        wallet,
        swapRewardsAddress,
        masterChefAddress
    )
    print("\n")

    await connectRouter(routerName, routerAddress, wallet, swapRewardsAddress)
    print("\n")

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
