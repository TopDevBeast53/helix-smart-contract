// This file maps contract addresses to their compiled contract names

const env = require("./env")
const contracts = require("./contracts")

const helixTokenAddress = contracts.helixToken[env.network]
const helixNftAddress = contracts.helixNFT[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const helixNftBridgeAddress = contracts.helixNFTBridge[env.network]
const helixChefNftAddress = contracts.helixChefNFT[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const vaultAddress = contracts.helixVault[env.network]
const factoryAddress = contracts.factory[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const routerAddress = contracts.router[env.network]
const migratorAddress = contracts.helixMigrator[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const autoHelixAddress = contracts.autoHelix[env.network]
const yieldSwapAddress = contracts.yieldSwap[env.network]
const lpSwapAddress = contracts.lpSwap[env.network]

module.exports = {
    helixTokenAddress: "HelixToken",
    helixNftAddress: "HelixNFT",
    feeMinterAddress: "FeeMinter",
    helixNftBridgeAddress: "HelixNFTBridge",
    helixChefNftAddress: "HelixChefNFT",
    feeHandlerAddress: "FeeHandler",
    referralRegisterAddress: "ReferralRegister",
    vaultAddress: "HelixVault",
    factoryAddress: "HelixFactory",
    oracleFactoryAddress: "OracleFactory",
    routerAddress: "HelixRouterV1",
    migratorAddress: "HelixMigrator",
    swapRewardsAddress: "SwapRewards",
    masterChefAddress: "MasterChef",
    autoHelixAddress: "AutoHelix",
    yieldSwapAddress: "YieldSwap",
    lpSwapAddress: "LpSwap",
}
