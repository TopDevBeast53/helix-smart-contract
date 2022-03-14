import { Wallet, Contract } from 'legacy-ethers';
import { Web3Provider } from 'legacy-ethers/providers'
import { deployContract } from 'legacy-ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import ERC20 from '../../build/contracts/ERC20LP.json'
import AuraFactory from '../../build/contracts/AuraFactory.json'
import AuraPair from '../../build/contracts/AuraPair.json'
import AuraRouterV1 from '../../build/contracts/AuraRouterV1.json'
import MasterChef from '../../build/contracts/MasterChef.json'
import AuraToken from '../../build/contracts/AuraToken.json'
import TestToken from '../../build/contracts/TestToken.json'
import WETH9 from '../../build/contracts/WETH9.json'
import ReferralRegister from '../../build/contracts/ReferralRegister.json'
import RouterEventEmitter from '../../build/contracts/RouterEventEmitter.json'
import SwapRewards from '../../build/contracts/SwapRewards.json'
import AuraNFT from '../../build/contracts/AuraNFT.json'
import OracleFactory from '../../build/contracts/OracleFactory.json'

const overrides = {
    gasLimit: 9999999
}

interface FullExchangeFixture {
    factory: Contract
    router: Contract
    oracleFactory: Contract
    refReg: Contract
    swapRewards: Contract
    auraToken: Contract
    auraNFT: Contract
    apToken: Contract
    tokenA: Contract
    tokenB: Contract
    tokenC: Contract
    tokenD: Contract
}

export async function fullExchangeFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<FullExchangeFixture> {
    // deploy factory
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides)

    // deploy oracleFactory
    const oracleFactory = await deployContract(wallet, OracleFactory, [factory.address], overrides)

    // deploy tokens
    const tokenA = await deployContract(wallet, TestToken, [expandTo18Decimals(100000)], overrides)
    const tokenB = await deployContract(wallet, TestToken, [expandTo18Decimals(100000)], overrides)
    const tokenC = await deployContract(wallet, TestToken, [expandTo18Decimals(100000)], overrides)
    const tokenD = await deployContract(wallet, TestToken, [expandTo18Decimals(100000)], overrides)

    const auraNFT = await deployContract(wallet, AuraNFT, [], overrides);
    const apToken = await deployContract(wallet, TestToken, [expandTo18Decimals(100000)], overrides);     // Use an AuraToken for now
    const auraToken = await deployContract(wallet, AuraToken, [], overrides)

    const WETH = await deployContract(wallet, WETH9, [], overrides)

    // deploy router
    const router = await deployContract(wallet, AuraRouterV1, [factory.address, WETH.address], overrides)

    const refReg = await deployContract(wallet, ReferralRegister,
        [
            auraToken.address,      // token
            10,                     // defaultStakingRef    (1%)
            10,                     // defaultSwapRef       (1%) 
        ], overrides)

    // Deploy the remaining contracts SwapRewards depends on.
    
    // Deploy SwapRewards
    const swapRewards = await deployContract(wallet, SwapRewards,
        [
            factory.address,        // factory
            router.address,         // router
            oracleFactory.address,  // oracleFactory
            refReg.address,         // refReg
            auraToken.address,      // auraToken
            auraNFT.address,        // auraNFT
            apToken.address,        // apToken
            500,                    // rewardPercentSplit   (0% AURA, 100% AP)
            50,                     // auraPercentReward    (5%)
            50                      // apPercentReward      (5%)
        ], overrides)

    return {
        factory,
        router,
        oracleFactory,
        refReg,
        swapRewards,
        auraToken,
        auraNFT,
        apToken,
        tokenA,
        tokenB,
        tokenC,
        tokenD,
    }
}
