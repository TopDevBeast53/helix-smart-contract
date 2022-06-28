// This script exports the "connect" functions which are used to (re)build the connections between 
// contracts

const { ethers } = require(`hardhat`)
const { print, loadContract } = require("./utilities")
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
                                                                                                      
const minters = initials.FEE_MINTER_MINTERS[env.network]
const toMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network] 

const connectFactory = async (wallet) => {
    print(`(re)build any references the factory contract holds to other contracts`)
    const factory = await loadContract(factoryName, factoryAddress, wallet)
    await setOracleFactory(factory, factoryName, oracleFactoryAddress)
}

const initFeeMinter = async (wallet) => {
    print(`(re)initialize the feeMinter to it's default state`)
    const feeMinter = await loadContract(feeMinterName, feeMinterAddress, wallet)
    await setToMintPercents(feeMinter, feeMinterName, minters, toMintPercents)
}

const connectHelixChefNft = async (wallet) => {
    const helixChefNft = await loadContract(helixChefNftName, helixChefNftAddress, wallet)
    await addAccruer(helixChefNft, helixChefNftName, feeHandlerAddress)
}

const connectHelixNft = async (wallet) => {
    const helixNft = await loadContract(helixNftName, helixNftAddress, wallet)
    await addMinter(helixNft, helixNftName, helixNftBridgeAddress)
    await addStaker(helixNft, helixNftName, helixChefNftAddress)
}

const connectHelixToken = async (wallet) => {
    const helixToken = await loadContract(helixTokenName, helixTokenAddress, wallet)
    await addMinter(helixToken, helixTokenName, referralRegisterAddress)
    await addMinter(helixToken, helixTokenName, vaultAddress)
    await addMinter(helixToken, helixTokenName, masterChefAddress)
}

const connectMasterChef = async (wallet) => {
    const masterChef = await loadContract(masterChefName, masterChefAddress, wallet)
    await setReferralRegister(masterChef, masterChefName, referralRegisterAddress)
}

const connectReferralRegister = async (wallet) => {
    const referralRegister = await loadContract(
        referralRegisterName,
        referralRegisterAddress,
        wallet
    )
    await addRecorder(referralRegister, referralRegisterName, swapRewardsAddress)
    await addRecorder(referralRegister, referralRegisterName, masterChefAddress)
}

const connectRouter = async (wallet) => {
    const router = await loadContract(routerName, routerAddress, wallet)
    await setSwapRewards(router, routerName, swapRewardsAddress)
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
