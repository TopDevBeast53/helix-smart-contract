import { Wallet, Contract } from 'legacy-ethers';
import { Web3Provider } from 'legacy-ethers/providers'
import { deployContract } from 'legacy-ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import ERC20 from '../../build/contracts/ERC20LP.json'
import ERC20LP from '../../build/contracts/ERC20LP.json'
import HelixFactory from '../../build/contracts/HelixFactory.json'
import HelixPair from '../../build/contracts/HelixPair.json'
import HelixRouterV1 from '../../build/contracts/HelixRouterV1.json'
import MasterChef from '../../build/contracts/MasterChef.json'
import HelixToken from '../../build/contracts/HelixToken.json'
import TestToken from '../../build/contracts/TestToken.json'
import WETH9 from '../../build/contracts/WETH9.json'
import ReferralRegister from '../../build/contracts/ReferralRegister.json'
import RouterEventEmitter from '../../build/contracts/RouterEventEmitter.json'
import HelixMigrator from '../../build/contracts/HelixMigrator.json'
import SwapRewards from '../../build/contracts/SwapRewards.json'
import OracleFactory from '../../build/contracts/OracleFactory.json'
import HelixNFT from '../../build/contracts/HelixNFT.json'
import TokenTools from '../../build/contracts/TokenTools.json'
import AutoHelix from '../../build/contracts/AutoHelix.json'
import SmartChef from '../../build/contracts/SmartChef.json'
import HelixChefNFT from '../../build/contracts/HelixChefNFT.json'
import HelixLP from '../../build/contracts/HelixLP.json'
import HelixNFTBridge from '../../build/contracts/HelixNFTBridge.json'

const addresses = require('../../scripts/constants/addresses')
const initials = require('../../scripts/constants/initials')
const env = require('../../scripts/constants/env')

const refRegDefaultStakingRef = initials.REFERRAL_STAKING_FEE_PERCENT[env.network]
const refRegDefaultSwapRef = initials.REFERRAL_SWAP_FEE_PERCENT[env.network]

const chefDeveloperAddress = addresses.masterChefDeveloper[env.network];
const chefStartBlock = initials.MASTERCHEF_START_BLOCK[env.network];
const chefHelixTokenRewardPerBlock = initials.MASTERCHEF_HELIX_TOKEN_REWARD_PER_BLOCK[env.network];
const chefStakingPercent = initials.MASTERCHEF_STAKING_PERCENT[env.network];
const chefDevPercent = initials.MASTERCHEF_DEV_PERCENT[env.network];

const autoHelixTreasuryAddress = addresses.autoHelixTreasuryAddress[env.network];

const smartChefStakingTokenAddress = addresses.BUSD[env.network];// token A which must be staked in this pool
const smartChefStartBlock = initials.SMARTCHEF_START_BLOCK[env.network];
const smartChefEndBlock = initials.SMARTCHEF_END_BLOCK[env.network];
const smartChefRewardPerBlock = initials.SMARTCHEF_REWARD_PER_BLOCK[env.network]

const helixNFTInitialHelixPoints = initials.NFT_INITIAL_HELIXPOINTS[env.network];
const helixNFTLevelUpPercent = initials.NFT_LEVEL_UP_PERCENT[env.network];

const helixChefNFTStartBlock = initials.NFTCHEF_START_BLOCK[env.network];
const helixChefNFTRewardPerBlock = initials.NFTCHEF_REWARD_PER_BLOCK[env.network];
const helixChefNFTLastRewardBlock = initials.NFTCHEF_LAST_REWARD_BLOCK[env.network];

const swapRewardsSplitRewardPercent = initials.SPLIT_REWARD_PERCENT[env.network]
const swapRewardsHelixRewardPercent = initials.HELIX_REWARD_PERCENT[env.network]
const swapRewardsApRewardPercent = initials.AP_REWARD_PERCENT[env.network]

const overrides = {
    gasLimit: 9999999
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
    helixToken: Contract
    oracleFactory: Contract
    refReg: Contract
    chef: Contract
    autoHelix: Contract
    smartChef: Contract
    helixNFT: Contract
    helixChefNFT: Contract
    helixNFTBridge: Contract
    helixLP: Contract
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
    const factory = await deployContract(wallet, HelixFactory, [wallet.address], overrides)
    const router = await deployContract(wallet, HelixRouterV1, [factory.address, WETH.address], overrides)
    // event emitter for testing
    const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [], overrides)

    // 2 deploy helix token
    const helixToken = await deployContract(wallet, HelixToken, [], overrides)

    // 3 deploy oracle factory and register with factory
    const oracleFactory = await deployContract(wallet, OracleFactory, [factory.address], overrides)
    await factory.setOracleFactory(oracleFactory.address)

    // 4 deploy referral register and register as minter with helix token
    const refReg = await deployContract(wallet, ReferralRegister,
        [helixToken.address, refRegDefaultStakingRef, refRegDefaultSwapRef],
        overrides
    )
    await helixToken.addMinter(refReg.address)

    // 5 deploy master chef and register as minter with helix token
    const chef = await deployContract(wallet, MasterChef, 
        [
            helixToken.address,
            chefDeveloperAddress,
            chefHelixTokenRewardPerBlock,
            chefStartBlock,
            chefStakingPercent,
            chefDevPercent,
            refReg.address
        ], 
        overrides
    )
    await helixToken.addMinter(chef.address)
    await refReg.addRecorder(chef.address)

    // 6 deploy auto helix
    const autoHelix = await deployContract(wallet, AutoHelix,
        [helixToken.address, chef.address, autoHelixTreasuryAddress], 
        overrides
    )

    // 7 deploy smart chef
    const smartChef = await deployContract(wallet, SmartChef,
        [
            smartChefStakingTokenAddress,
            helixToken.address,
            smartChefRewardPerBlock,
            smartChefStartBlock,
            smartChefEndBlock
        ], 
        overrides
    )

    // 8 deploy helixNFT and helixChefNFT and register with other contracts
    const helixNFT = await deployContract(wallet, HelixNFT, [], overrides)
    await helixNFT.initialize("BASEURI", helixNFTInitialHelixPoints, helixNFTLevelUpPercent)
    const helixChefNFT = await deployContract(wallet, HelixChefNFT, [helixNFT.address, helixChefNFTLastRewardBlock], overrides)

    await helixNFT.addMinter(wallet.address, overrides)
    await helixNFT.addStaker(helixChefNFT.address, overrides)
    await helixChefNFT.addNewRewardToken(helixToken.address, helixChefNFTStartBlock, helixChefNFTRewardPerBlock, overrides)

    // 9 deploy helixNFTBridge, add a bridger, and register as minter
    const helixNFTBridge = await deployContract(wallet, HelixNFTBridge, [helixNFT.address], overrides)
    await helixNFTBridge.addBridger(wallet.address, overrides)
    await helixNFT.addMinter(helixNFTBridge.address, overrides)


    // 10 deploy AP/LP token
    const helixLP = await deployContract(wallet, ERC20LP, [expandTo18Decimals(10000)], overrides);

    // 11 deploy swapRewards and register with other contracts
    const swapRewards = await deployContract(wallet, SwapRewards, [
            router.address,
            oracleFactory.address,
            refReg.address,
            helixToken.address,
            helixNFT.address,
            helixLP.address,
            swapRewardsSplitRewardPercent,
            swapRewardsHelixRewardPercent,
            swapRewardsApRewardPercent
        ], 
        overrides
    )
    await router.setSwapRewards(swapRewards.address, overrides)
    await refReg.addRecorder(swapRewards.address, overrides)
    await helixToken.addMinter(swapRewards.address, overrides)
    await helixNFT.addAccruer(swapRewards.address, overrides)

    // Add external DEX components for migrator to use.
    const externalFactory = await deployContract(wallet, HelixFactory, [wallet.address], overrides);
    const externalOracleFactory = await deployContract(wallet, OracleFactory, [externalFactory.address], overrides)
    await externalFactory.setOracleFactory(externalOracleFactory.address)
    const externalRouter = await deployContract(wallet, HelixRouterV1, [externalFactory.address, WETH.address], overrides);

    // 12 deploy migrator
    const migrator = await deployContract(wallet, HelixMigrator, [router.address], overrides);

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
        helixToken,
        oracleFactory,
        refReg,
        chef,
        autoHelix,
        smartChef,
        helixNFT,
        helixChefNFT,
        helixNFTBridge,
        helixLP,
        swapRewards,
        externalFactory,
        externalRouter,
        migrator, 
        tokenTools,
    }
}
