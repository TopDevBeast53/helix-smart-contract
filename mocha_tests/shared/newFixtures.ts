import { Wallet, Contract } from 'legacy-ethers';
import { Web3Provider } from 'legacy-ethers/providers'
import { deployContract } from 'legacy-ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import ERC20 from '../../build/contracts/ERC20LP.json'
import ERC20LP from '../../build/contracts/ERC20LP.json'
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
import OracleFactory from '../../build/contracts/OracleFactory.json'
import AuraNFT from '../../build/contracts/AuraNFT.json'
import TokenTools from '../../build/contracts/TokenTools.json'
import AutoAura from '../../build/contracts/AutoAura.json'
import SmartChef from '../../build/contracts/SmartChef.json'
import AuraChefNFT from '../../build/contracts/AuraChefNFT.json'
import AuraLP from '../../build/contracts/AuraLP.json'
import AuraNFTBridge from '../../build/contracts/AuraNFTBridge.json'

const addresses = require('../../scripts/constants/addresses')
const initials = require('../../scripts/constants/initials')
const env = require('../../scripts/constants/env')

const refRegDefaultStakingRef = initials.REFERRAL_STAKING_FEE_PERCENT[env.network]
const refRegDefaultSwapRef = initials.REFERRAL_SWAP_FEE_PERCENT[env.network]

const chefDeveloperAddress = addresses.masterChefDeveloper[env.network];
const chefStartBlock = initials.MASTERCHEF_START_BLOCK[env.network];
const chefAuraTokenRewardPerBlock = initials.MASTERCHEF_AURA_TOKEN_REWARD_PER_BLOCK[env.network];
const chefStakingPercent = initials.MASTERCHEF_STAKING_PERCENT[env.network];
const chefDevPercent = initials.MASTERCHEF_DEV_PERCENT[env.network];

const autoAuraTreasuryAddress = addresses.autoAuraTreasuryAddress[env.network];

const smartChefStakingTokenAddress = addresses.BUSD[env.network];// token A which must be staked in this pool
const smartChefStartBlock = initials.SMARTCHEF_START_BLOCK[env.network];
const smartChefEndBlock = initials.SMARTCHEF_END_BLOCK[env.network];
const smartChefRewardPerBlock = initials.SMARTCHEF_REWARD_PER_BLOCK[env.network]

const auraNFTInitialAuraPoints = initials.NFT_INITIAL_AURAPOINTS[env.network];
const auraNFTLevelUpPercent = initials.NFT_LEVEL_UP_PERCENT[env.network];

const auraChefNFTStartBlock = initials.NFTCHEF_START_BLOCK[env.network];
const auraChefNFTRewardPerBlock = initials.NFTCHEF_REWARD_PER_BLOCK[env.network];
const auraChefNFTLastRewardBlock = initials.NFTCHEF_LAST_REWARD_BLOCK[env.network];

const swapRewardsSplitRewardPercent = initials.SPLIT_REWARD_PERCENT[env.network]
const swapRewardsAuraRewardPercent = initials.AURA_REWARD_PERCENT[env.network]
const swapRewardsApRewardPercent = initials.AP_REWARD_PERCENT[env.network]

const overrides = {
    gasLimit: 9999999
}

interface FactoryFixture {
    factory: Contract
    oracleFactory: Contract
}

export async function factoryFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<FactoryFixture> {
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides)
    const oracleFactory = await deployContract(wallet, OracleFactory, [factory.address], overrides)
    await factory.setOracleFactory(oracleFactory.address)
    return { factory, oracleFactory }
}

interface PairFixture extends FactoryFixture {
    token0: Contract
    token1: Contract
    pair: Contract
}

export async function pairFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<PairFixture> {
    const { factory, oracleFactory } = await factoryFixture(provider, [wallet])

    const tokenA = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)
    const tokenB = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)

    await factory.createPair(tokenA.address, tokenB.address, overrides)
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
    const pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

    const token0Address = (await pair.token0()).address
    const token0 = tokenA.address === token0Address ? tokenA : tokenB
    const token1 = tokenA.address === token0Address ? tokenB : tokenA

    return { factory, token0, token1, pair, oracleFactory }
}

interface FullExchangeFixture {
    tokenA: Contract
    tokenB: Contract
    tokenC: Contract
    tokenD: Contract
    tokenE: Contract
    tokenF: Contract
    WETH: Contract
    factory: Contract
    router: Contract
    routerEventEmitter: Contract
    auraToken: Contract
    oracleFactory: Contract
    refReg: Contract
    chef: Contract
    autoAura: Contract
    smartChef: Contract
    auraNFT: Contract
    auraChefNFT: Contract
    auraNFTBridge: Contract
    auraLP: Contract
    swapRewards: Contract
    externalFactory: Contract
    externalRouter: Contract
    migrator: Contract
    tokenTools: Contract
}

export async function fullExchangeFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<FullExchangeFixture> {
    // 0 deploy tokens
    const tokenA = await deployContract(wallet, TestToken, ['Test Token A', 'TTA', expandTo18Decimals(100000)], overrides)
    const tokenB = await deployContract(wallet, TestToken, ['Test Token B', 'TTB', expandTo18Decimals(100000)], overrides)
    const tokenC = await deployContract(wallet, TestToken, ['Test Token C', 'TTC', expandTo18Decimals(100000)], overrides)
    const tokenD = await deployContract(wallet, TestToken, ['Test Token D', 'TTD', expandTo18Decimals(100000)], overrides)
    const tokenE = await deployContract(wallet, TestToken, ['Test Token E', 'TTE', expandTo18Decimals(100000)], overrides)
    const tokenF = await deployContract(wallet, TestToken, ['Test Token F', 'TTF', expandTo18Decimals(100000)], overrides)

    const WETH = await deployContract(wallet, WETH9, [], overrides)

    // 1 deploy factory and router
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides)
    const router = await deployContract(wallet, AuraRouterV1, [factory.address, WETH.address], overrides)
    // event emitter for testing
    const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [], overrides)

    // 2 deploy aura token
    const auraToken = await deployContract(wallet, AuraToken, [], overrides)

    // 3 deploy oracle factory and register with factory
    const oracleFactory = await deployContract(wallet, OracleFactory, [factory.address], overrides)
    await factory.setOracleFactory(oracleFactory.address)

    // 4 deploy referral register and register as minter with aura token
    const refReg = await deployContract(wallet, ReferralRegister,
        [auraToken.address, refRegDefaultStakingRef, refRegDefaultSwapRef],
        overrides
    )
    await auraToken.addMinter(refReg.address)

    // 5 deploy master chef and register as minter with aura token
    const chef = await deployContract(wallet, MasterChef, 
        [
            auraToken.address,
            chefDeveloperAddress,
            chefAuraTokenRewardPerBlock,
            chefStartBlock,
            chefStakingPercent,
            chefDevPercent,
            refReg.address
        ], 
        overrides
    )
    await auraToken.addMinter(chef.address)
    await refReg.addRecorder(chef.address)

    // 6 deploy auto aura
    const autoAura = await deployContract(wallet, AutoAura,
        [auraToken.address, chef.address, autoAuraTreasuryAddress], 
        overrides
    )

    // 7 deploy smart chef
    const smartChef = await deployContract(wallet, SmartChef,
        [
            smartChefStakingTokenAddress,
            auraToken.address,
            smartChefRewardPerBlock,
            smartChefStartBlock,
            smartChefEndBlock
        ], 
        overrides
    )

    // 8 deploy auraNFT and auraChefNFT and register with other contracts
    const auraNFT = await deployContract(wallet, AuraNFT, [], overrides)
    await auraNFT.initialize("BASEURI", auraNFTInitialAuraPoints, auraNFTLevelUpPercent)
    const auraChefNFT = await deployContract(wallet, AuraChefNFT, [auraNFT.address, auraChefNFTLastRewardBlock], overrides)

    await auraNFT.addMinter(wallet.address, overrides)
    await auraNFT.addStaker(auraChefNFT.address, overrides)
    await auraChefNFT.addNewRewardToken(auraToken.address, auraChefNFTStartBlock, auraChefNFTRewardPerBlock, overrides)

    // 9 deploy auraNFTBridge, add a bridger, and register as minter
    const auraNFTBridge = await deployContract(wallet, AuraNFTBridge, [auraNFT.address], overrides)
    await auraNFTBridge.addBridger(wallet.address, overrides)
    await auraNFT.addMinter(auraNFTBridge.address, overrides)


    // 10 deploy AP/LP token
    const auraLP = await deployContract(wallet, ERC20LP, [expandTo18Decimals(10000)], overrides);

    // 11 deploy swapRewards and register with other contracts
    const swapRewards = await deployContract(wallet, SwapRewards, [
            router.address,
            oracleFactory.address,
            refReg.address,
            auraToken.address,
            auraNFT.address,
            auraLP.address,
            swapRewardsSplitRewardPercent,
            swapRewardsAuraRewardPercent,
            swapRewardsApRewardPercent
        ], 
        overrides
    )
    await router.setSwapRewards(swapRewards.address, overrides)
    await refReg.addRecorder(swapRewards.address, overrides)
    await auraToken.addMinter(swapRewards.address, overrides)
    await auraNFT.addAccruer(swapRewards.address, overrides)

    // Add external DEX components for migrator to use.
    const externalFactory = await deployContract(wallet, AuraFactory, [wallet.address], overrides);
    const externalOracleFactory = await deployContract(wallet, OracleFactory, [externalFactory.address], overrides)
    await externalFactory.setOracleFactory(externalOracleFactory.address)
    const externalRouter = await deployContract(wallet, AuraRouterV1, [externalFactory.address, WETH.address], overrides);

    // 12 deploy migrator
    const migrator = await deployContract(wallet, AuraMigrator, [router.address], overrides);

    // 13 deploy token tools
    const tokenTools = await deployContract(wallet, TokenTools, [], overrides)

    return {
        tokenA,
        tokenB,
        tokenC,
        tokenD,
        tokenE,
        tokenF,
        WETH,
        factory,
        router,
        routerEventEmitter,
        auraToken,
        oracleFactory,
        refReg,
        chef,
        autoAura,
        smartChef,
        auraNFT,
        auraChefNFT,
        auraNFTBridge,
        auraLP,
        swapRewards,
        externalFactory,
        externalRouter,
        migrator, 
        tokenTools,
    }
}
