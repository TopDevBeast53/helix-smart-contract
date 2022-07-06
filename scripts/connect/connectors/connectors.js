// This script exports the "connect" functions which are used to (re)build the connections between
// contracts

const { ethers } = require(`hardhat`)
const { print, loadContract, getContractName } = require("./utilities")
const {
    setCollectorPercent,
    setNftChefPercent,
    transferTimelockOwnership,
    setToMintPercents,
    setOracleFactory,
    addAccruer,
    addMinter,
    addStaker,
    setReferralRegister,
    addRecorder,
    setSwapRewards
} = require("./setters")

const env = require('../constants/env')
const contracts = require('../constants/contracts')
const initials = require("../constants/initials")

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

const minters = initials.FEE_MINTER_MINTERS[env.network]
const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

const connectFactory = async (wallet) => {
    print(`(re)build any references the factory contract holds to other contracts`)
    const factory = await loadContract(factoryAddress, wallet)
    await setOracleFactory(factory, oracleFactoryAddress)
}

const initFeeMinter = async (wallet) => {
    print(`(re)initialize the feeMinter to it's default state`)
    const feeMinter = await loadContract(feeMinterAddress, wallet)
    await setToMintPercents(feeMinter, minters, toMintPercents)
}

const connectHelixChefNft = async (wallet) => {
    const helixChefNft = await loadContract(helixChefNftAddress, wallet)
    await addAccruer(helixChefNft, feeHandlerAddress)
}

const connectHelixNft = async (wallet) => {
    const helixNft = await loadContract(helixNftAddress, wallet)
    await addMinter(helixNft, helixNftBridgeAddress)
    await addStaker(helixNft, helixChefNftAddress)
}

const connectHelixToken = async (wallet) => {
    const helixToken = await loadContract(helixTokenAddress, wallet)
    await addMinter(helixToken, referralRegisterAddress)
    await addMinter(helixToken, vaultAddress)
    await addMinter(helixToken, masterChefAddress)
}

const connectMasterChef = async (wallet) => {
    const masterChef = await loadContract(masterChefAddress, wallet)
    await setReferralRegister(masterChef, referralRegisterAddress)
}

const connectReferralRegister = async (wallet) => {
    const referralRegister = await loadContract(
        referralRegisterAddress,
        wallet
    )
    await addRecorder(referralRegister, swapRewardsAddress)
    await addRecorder(referralRegister, masterChefAddress)
}

const connectRouter = async (wallet) => {
    const router = await loadContract(routerAddress, wallet)
    await setSwapRewards(router, swapRewardsAddress)
}

module.exports = {
    connectFactory: connectFactory,
    connectHelixChefNft: connectHelixChefNft,
    connectHelixNft: connectHelixNft,
    connectHelixToken: connectHelixToken,
    connectMasterChef: connectMasterChef,
    connectReferralRegister: connectReferralRegister,
    connectRouter: connectRouter,
    initFeeMinter: initFeeMinter,
}
