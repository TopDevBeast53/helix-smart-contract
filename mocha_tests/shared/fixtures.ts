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
import AuraMigrator from '../../build/contracts/AuraMigrator.json'
import SwapRewards from '../../build/contracts/SwapRewards.json'
// import Oracle from '../../build/contracts/Oracle.json'
import OracleFactory from '../../build/contracts/OracleFactory.json'
import AuraNFT from '../../build/contracts/AuraNFT.json'

interface FactoryFixture {
    factory: Contract
}

const overrides = {
    gasLimit: 9999999
}

export async function factoryFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<FactoryFixture> {
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides)
    return {
        factory
    }
}

interface PairFixture extends FactoryFixture {
    token0: Contract
    token1: Contract
    pair: Contract
}

export async function pairFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<PairFixture> {
    const { factory } = await factoryFixture(provider, [wallet])

    const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
    const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)

    await factory.createPair(tokenA.address, tokenB.address, overrides)
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
    const pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

    const token0Address = (await pair.token0()).address
    const token0 = tokenA.address === token0Address ? tokenA : tokenB
    const token1 = tokenA.address === token0Address ? tokenB : tokenA

    return { factory, token0, token1, pair }
}

interface FullExchangeFixture {
    token0: Contract
    token1: Contract
    WETH: Contract
    WETHPartner: Contract
    factory: Contract
    router: Contract
    routerEventEmitter: Contract
    pair: Contract
    WETHPair: Contract
    chef: Contract
    auraToken: Contract
    refReg: Contract
    migrator: Contract
    externalFactory: Contract
    externalRouter: Contract
    swapRewards: Contract
    // oracle: Contract
    oracleFactory: Contract
    auraNFT: Contract
    apToken: Contract
    tokenA: Contract
    tokenB: Contract
    tokenC: Contract
    tokenD: Contract
}

export async function fullExchangeFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<FullExchangeFixture> {
    // deploy tokens
    const tokenA = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)
    const tokenB = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)
    const tokenC = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)
    const tokenD = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)

    const WETH = await deployContract(wallet, WETH9, [], overrides)
    const WETHPartner = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)

    // deploy factory
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides)
    const oracleFactory = await deployContract(wallet, OracleFactory, [factory.address], overrides)
    await factory.setOracleFactory(oracleFactory.address)

    // deploy router
    const router = await deployContract(wallet, AuraRouterV1, [factory.address, WETH.address], overrides)
    // event emitter for testing
    const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [], overrides)
    // initialize
    await factory.createPair(tokenA.address, tokenB.address)
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
    const pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

    // Add migrator.
    const migrator = await deployContract(wallet, AuraMigrator, [router.address], overrides);

    // Add external DEX components for migrator to use.
    const externalFactory = await deployContract(wallet, AuraFactory, [wallet.address], overrides);
    const externalOracleFactory = await deployContract(wallet, OracleFactory, [externalFactory.address], overrides)
    await externalFactory.setOracleFactory(externalOracleFactory.address)

    const externalRouter = await deployContract(wallet, AuraRouterV1, [externalFactory.address, WETH.address], overrides);

    const auraToken = await deployContract(wallet, AuraToken, [], overrides)

    const token0Address = await pair.token0()
    const token0 = tokenA.address === token0Address ? tokenA : tokenB
    const token1 = tokenA.address === token0Address ? tokenB : tokenA

    await factory.createPair(WETH.address, WETHPartner.address)
    const WETHPairAddress = await factory.getPair(WETH.address, WETHPartner.address)
    const WETHPair = new Contract(WETHPairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

    const refReg = await deployContract(wallet, ReferralRegister,
        [
            auraToken.address,      // token
            10,                     // defaultStakingRef
            10,                     // defaultSwapRef
        ], overrides)

    // Deploy the remaining contracts SwapRewards depends on.
    // const oracle = await deployContract(wallet, Oracle, [factory.address, 10, 2], overrides); 
    const auraNFT = await deployContract(wallet, AuraNFT, [], overrides);
    const apToken = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides);     // Use an AuraToken for now

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
            0,                      // rewardPercentSplit (0% AURA, 100% AP)
            50,                     // auraPercentReward (5%)
            50                      // apPercentReward (5%)
        ], overrides)

    const chef = await deployContract(wallet, MasterChef, 
        [
            auraToken.address,      // aura token address
            wallet.address,         // dev address
            '30000000000000000000', // aura token per block
            1,                      // start block
            999999,                 // staking percent
            1,                      // dev percent
            refReg.address,         // referral register
        ], overrides)

    return {
        token0,
        token1,
        WETH,
        WETHPartner,
        factory,
        router,
        routerEventEmitter,
        pair,
        WETHPair,
        chef,
        refReg,
        auraToken,
        migrator, 
        externalFactory,
        externalRouter,
        swapRewards,
        oracleFactory,
        auraNFT,
        apToken,
        tokenA,
        tokenB,
        tokenC,
        tokenD,
    }
}
