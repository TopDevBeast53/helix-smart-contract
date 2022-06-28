/* 
 * @dev Used to transfer ownership of all contracts with owners to multisig control
 * 
 * Run from project root using:
 *     npx hardhat run scripts/3_transfer/1_transferAllMultiSigOwner.js --network ropsten
 */

const verbose = true

const { ethers } = require("hardhat");
const { print, loadContract, transferOwnership } = require("../shared/utilities")

const env = require("./../constants/env")
const contracts = require("./../constants/contracts")

/// Address of the owner multiSig contract
const multiSigAddress = contracts.ownerMultiSig[env.network]

const feeMinterAddress = contracts.feeMinter[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const vaultAddress = contracts.helixVault[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const autoHelixAddress = contracts.autoHelix[env.network]

const migratorAddress = contracts.helixMigrator[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]
const helixChefNftAddress = contracts.helixChefNFT[env.network]
const routerAddress = contracts.router[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]
const lpSwapAddress = contracts.lpSwap[env.network]
const yieldSwapAddress = contracts.yieldSwap[env.network]

const feeMinterName = "FeeMinter"
const feeHandlerName = "FeeHandler"
const referralRegisterName = "ReferralRegister"
const vaultName = "HelixVault"
const masterChefName = "MasterChef"
const autoHelixName = "AutoHelix"

const migratorName = "HelixMigrator"
const oracleFactoryName = "OracleFactory"
const helixNftBridgeName = "HelixNFTBridge"
const helixChefNftName = "HelixChefNFT"
const routerName = "HelixRouterV1"
const swapRewardsName = "SwapRewards"
const lpSwapName = "LpSwap"
const yieldSwapName = "YieldSwap"

/// Transfer ownership of the contract to multiSig
async function main() {
    const [wallet] = await ethers.getSigners()

    const feeMinter = await loadContract(feeMinterName, feeMinterAddress, wallet) 
    await transferOwnership(feeMinter, feeMinterName, multiSigAddress)

    const feeHandler = await loadContract(feeHandlerName, feeHandlerAddress, wallet)
    await transferOwnership(feeHandler, feeHandlerName, multiSigAddress)

    const referralRegister = await loadContract(referralRegisterName, referralRegisterAddress, wallet) 
    await transferOwnership(referralRegister, referralRegisterName, multiSigAddress)

    const vault = await loadContract(vaultName, vaultAddress, wallet) 
    await transferOwnership(vault, vaultName, multiSigAddress)

    const masterChef = await loadContract(masterChefName, masterChefAddress, wallet) 
    await transferOwnership(masterChef, masterChefName, multiSigAddress)

    const autoHelix = await loadContract(autoHelixName, autoHelixAddress, wallet) 
    await transferOwnership(autoHelix, autoHelixName, multiSigAddress)

    const migrator = await loadContract(migratorName, migratorAddress, wallet) 
    await transferOwnership(migrator, migratorName, multiSigAddress)

    const oracleFactory = await loadContract(oracleFactoryName, oracleFactoryAddress, wallet) 
    await transferOwnership(oracleFactory, oracleFactoryName, multiSigAddress)

    const helixNftBridge = await loadContract(helixNftBridgeName, helixNftBridgeAddress, wallet) 
    await transferOwnership(helixNftBridge, helixNftBridgeName, multiSigAddress)

    const helixChefNft = await loadContract(helixChefNftName, helixChefNftAddress, wallet) 
    await transferOwnership(helixChefNft, helixChefNftName, multiSigAddress)

    const router = await loadContract(routerName, routerAddress, wallet) 
    await transferOwnership(router, routerName, multiSigAddress)

    const swapRewards = await loadContract(swapRewardsName, swapRewardsAddress, wallet) 
    await transferOwnership(swapRewards, swapRewardsName, multiSigAddress)

    const lpSwap = await loadContract(lpSwapName, lpSwapAddress, wallet) 
    await transferOwnership(lpSwap, lpSwapName, multiSigAddress)

    const yieldSwap = await loadContract(yieldSwapName, yieldSwapAddress, wallet) 
    await transferOwnership(yieldSwap, yieldSwapName, multiSigAddress)

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
