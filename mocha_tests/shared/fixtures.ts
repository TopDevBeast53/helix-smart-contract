import { Wallet, Contract } from 'legacy-ethers';
import { Web3Provider } from 'legacy-ethers/providers'
import { deployContract } from 'legacy-ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import ERC20 from '../../build/contracts/ERC20LP.json'
import ERC20LP from '../../build/contracts/ERC20LP.json'
import HelixFactory from '../../build/contracts/HelixFactory.json'
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
import HelixChefNFT from '../../build/contracts/HelixChefNFT.json'
import HelixLP from '../../build/contracts/HelixLP.json'
import HelixNFTBridge from '../../build/contracts/HelixNFTBridge.json'
import HelixVault from '../../build/contracts/HelixVault.json'
import VipPresale from '../../build/contracts/VipPresale.json'
import PublicPresale from '../../build/contracts/PublicPresale.json'
import AirDrop from '../../build/contracts/AirDrop.json'
import YieldSwap from '../../build/contracts/YieldSwap.json'
import LpSwap from '../../build/contracts/LpSwap.json'
import FeeHandler from '../../build/contracts/FeeHandler.json'

const addresses = require('../../scripts/constants/addresses')
const initials = require('../../scripts/constants/initials')
const env = require('../../scripts/constants/env')

const refRegDefaultStakingRef = initials.REFERRAL_STAKING_FEE_PERCENT[env.network]
const refRegDefaultSwapRef = initials.REFERRAL_SWAP_FEE_PERCENT[env.network]
const refRegToMintPerBlock = initials.REFERRAL_TO_MINT_PER_BLOCK[env.network]

const chefDeveloperAddress = addresses.masterChefDeveloper[env.network];
const chefStartBlock = initials.MASTERCHEF_START_BLOCK[env.network];
const chefHelixTokenRewardPerBlock = initials.MASTERCHEF_HELIX_TOKEN_REWARD_PER_BLOCK[env.network];
const chefStakingPercent = initials.MASTERCHEF_STAKING_PERCENT[env.network];
const chefDevPercent = initials.MASTERCHEF_DEV_PERCENT[env.network];

const autoHelixTreasuryAddress = addresses.TREASURY[env.network];

const swapRewardsSplitRewardPercent = initials.SPLIT_REWARD_PERCENT[env.network]
const swapRewardsHelixRewardPercent = initials.HELIX_REWARD_PERCENT[env.network]
const swapRewardsApRewardPercent = initials.HP_REWARD_PERCENT[env.network]

const helixVaultRewardPerBlock = initials.HELIX_VAULT_REWARD_PER_BLOCK[env.network]
const helixVaultStartBlock = initials.HELIX_VAULT_START_BLOCK[env.network]
const helixVaultBonusEndBlock = initials.HELIX_VAULT_BONUS_END_BLOCK[env.network]
const helixVaultTreasuryAddress = initials.HELIX_VAULT_TREASURY_ADDRESS[env.network]

const vipPresaleInputRate = initials.VIP_PRESALE_INPUT_RATE[env.network]
const vipPresaleOutputRate = initials.VIP_PRESALE_OUTPUT_RATE[env.network]
const vipPresalePurchasePhaseDuration = initials.VIP_PRESALE_PURCHASE_PHASE_DURATION[env.network]
const vipPresaleWithdrawPhaseDuration = initials.VIP_PRESALE_WITHDRAW_PHASE_DURATION[env.network]

const publicPresaleInputRate = initials.PUBLIC_PRESALE_INPUT_RATE[env.network]
const publicPresaleOutputRate = initials.PUBLIC_PRESALE_OUTPUT_RATE[env.network]
const publicPresalePurchasePhaseDuration = initials.PUBLIC_PRESALE_PURCHASE_PHASE_DURATION[env.network]

const airdropWithdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[env.network]

const yieldSwapTreasury = initials.YIELD_SWAP_TREASURY[env.network]
const yieldSwapMinLockDuration = initials.YIELD_SWAP_MIN_LOCK_DURATION[env.network]
const yieldSwapMaxLockDuration = initials.YIELD_SWAP_MAX_LOCK_DURATION[env.network]

const treasuryAddress = addresses.TREASURY[env.network]

const overrides = {
    gasLimit: 9999999
}

const billion = 1000000000

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
    helixNFT: Contract
    helixChefNFT: Contract
    helixNFTBridge: Contract
    helixLP: Contract
    helixLP2: Contract
    swapRewards: Contract
    externalFactory: Contract
    externalRouter: Contract
    migrator: Contract
    tokenTools: Contract
    vault: Contract
    vipPresale: Contract
    publicPresale: Contract
    airDrop: Contract
    yieldSwap: Contract
    lpSwap: Contract
    feeHandler: Contract
}

export async function fullExchangeFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<FullExchangeFixture> {
    // 0 deploy tokens
    const tokenA = await deployContract(wallet, TestToken, ['Test Token A', 'TTA', expandTo18Decimals(1 * billion)], overrides)
    const tokenB = await deployContract(wallet, TestToken, ['Test Token B', 'TTB', expandTo18Decimals(1 * billion)], overrides)
    const tokenC = await deployContract(wallet, TestToken, ['Test Token C', 'TTC', expandTo18Decimals(1 * billion)], overrides)
    const tokenD = await deployContract(wallet, TestToken, ['Test Token D', 'TTD', expandTo18Decimals(1 * billion)], overrides)
    const tokenE = await deployContract(wallet, TestToken, ['Test Token E', 'TTE', expandTo18Decimals(1 * billion)], overrides)
    const tokenF = await deployContract(wallet, TestToken, ['Test Token F', 'TTF', expandTo18Decimals(1 * billion)], overrides)

    const WETH = await deployContract(wallet, WETH9, [], overrides)

    // 1 deploy factory
    const factory = await deployContract(wallet, HelixFactory, [], overrides)
    await factory.initialize(wallet.address)

    // 2 deploy router
    const router = await deployContract(wallet, HelixRouterV1, [factory.address, WETH.address], overrides)
    // event emitter for testing
    const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [], overrides)

    // 3 deploy helix token
    const helixToken = await deployContract(wallet, HelixToken, [], overrides)

    // 4 deploy oracle factory and register with factory
    const oracleFactory = await deployContract(wallet, OracleFactory, [], overrides)
    await oracleFactory.initialize(factory.address)
    await factory.setOracleFactory(oracleFactory.address)

    // 5 deploy helixNFT and helixChefNFT and register with other contracts
    const helixNFT = await deployContract(wallet, HelixNFT, [], overrides)
    await helixNFT.initialize("BASEURI")

    const helixChefNFT = await deployContract(wallet, HelixChefNFT, [], overrides)
    await helixChefNFT.initialize(helixNFT.address, helixToken.address)

    await helixNFT.addMinter(wallet.address, overrides)
    await helixNFT.addStaker(helixChefNFT.address, overrides)

    // 6 Deploy the fee handler and initialize the fee handler
    const feeHandler = await deployContract(wallet, FeeHandler, [], overrides)
    await feeHandler.initialize(treasuryAddress, helixChefNFT.address)

    // Mark the feeHandler as a helixChefNFT accruer
    await helixChefNFT.addAccruer(feeHandler.address)

    // 7 deploy referral register and register as minter with helix token
    const refReg = await deployContract(wallet, ReferralRegister, [], overrides)
    await refReg.initialize(
        helixToken.address, 
        feeHandler.address, 
        refRegDefaultStakingRef, 
        refRegDefaultSwapRef,
        refRegToMintPerBlock,
        0      // TODO replace
    );
    await helixToken.addMinter(refReg.address)

    // 8 deploy master chef and register as minter with helix token
    const chef = await deployContract(wallet, MasterChef, [], overrides)
    await chef.initialize(
        helixToken.address,
        chefDeveloperAddress,
        chefHelixTokenRewardPerBlock,
        chefStartBlock,
        chefStakingPercent,
        chefDevPercent,
        refReg.address
    )

    await helixToken.addMinter(chef.address)
    await refReg.addRecorder(chef.address)

    // 9 deploy auto helix
    const autoHelix = await deployContract(wallet, AutoHelix, [], overrides)
    await autoHelix.initialize(helixToken.address, chef.address, autoHelixTreasuryAddress)

    // 10 deploy helixNFTBridge, add a bridger, and register as minter
    const helixNFTBridge = await deployContract(wallet, HelixNFTBridge, [helixNFT.address], overrides)

    // Comment to prevent error since no externalTokenID is being passed
    // await helixNFTBridge.addBridger(wallet.address, overrides)

    await helixNFT.addMinter(helixNFTBridge.address, overrides)

    // 11 deploy swapRewards and register with other contracts
    const swapRewards = await deployContract(wallet, SwapRewards, [
            helixToken.address,
            oracleFactory.address,
            refReg.address,
            router.address
        ], 
        overrides
    )
    await router.setSwapRewards(swapRewards.address, overrides)
    await refReg.addRecorder(swapRewards.address, overrides)

    // 12 deploy migrator
    // Add external DEX components for migrator to use.
    const externalFactory = await deployContract(wallet, HelixFactory, [], overrides);
    await externalFactory.initialize(wallet.address)
  
    const externalOracleFactory = await deployContract(wallet, OracleFactory, [], overrides)
    await externalOracleFactory.initialize(externalFactory.address)
  
    await externalFactory.setOracleFactory(externalOracleFactory.address)
    const externalRouter = await deployContract(wallet, HelixRouterV1, [externalFactory.address, WETH.address], overrides);

    const migrator = await deployContract(wallet, HelixMigrator, [router.address], overrides);

    // 13 deploy helix vault
    const vault = await deployContract(wallet, HelixVault, [], overrides)
    await vault.initialize(
            helixToken.address,
            feeHandler.address,
            helixVaultRewardPerBlock,
            helixVaultStartBlock,
            helixVaultBonusEndBlock
    )
    await helixToken.addMinter(vault.address, overrides)

    // 14 deploy vip presale contract
    const vipPresale = await deployContract(wallet, VipPresale, 
        [
            tokenA.address,                     // inputToken, stand-in for BUSD
            helixToken.address,                 // outputToken, the presale token
            wallet.address,                     // treasury, address that receives inputToken
            vipPresaleInputRate,                // # inputToken per ticket
            vipPresaleOutputRate,               // # outputToken per ticket
            vipPresalePurchasePhaseDuration,    // length of phase
            vipPresaleWithdrawPhaseDuration     // length of phase
        ], 
        overrides
    )
    // presale must be registered as helixToken minter to be able to burn tokens
    await helixToken.addMinter(vipPresale.address)

    // 15 deploy public presale contract
    const publicPresale = await deployContract(wallet, PublicPresale, 
        [
            tokenA.address,                     // inputToken, stand-in for BUSD
            helixToken.address,                 // outputToken, the presale token
            wallet.address,                     // treasury, address that receives inputToken
            publicPresaleInputRate,             // # inputToken per ticket
            publicPresaleOutputRate,            // # outputToken per ticket
            publicPresalePurchasePhaseDuration  // length of phase
        ], 
        overrides
    )
    // presale must be registered as helixToken minter to be able to burn tokens
    await helixToken.addMinter(publicPresale.address)

    // 16 deploy airdrop presale contract
    const airDrop = await deployContract(wallet, AirDrop, 
        [
            "AirDrop",                      // contract name
            helixToken.address,             // outputToken, the presale token
            airdropWithdrawPhaseDuration,   // length of phase
        ], 
        overrides
    )
    // presale must be registered as helixToken minter to be able to burn tokens
    await helixToken.addMinter(airDrop.address)

    // Used by yield swap
    const helixLP = await deployContract(wallet, ERC20LP, [expandTo18Decimals(10000)], overrides);
    // used in YieldSwap tests with 2 helixLP tokens
    const helixLP2 = await deployContract(wallet, ERC20LP, [expandTo18Decimals(10000)], overrides);

    // 17 deploy yield swap contract
    const yieldSwap = await deployContract(wallet, YieldSwap, [], overrides)
    await yieldSwap.initialize(
            chef.address,                   // chef used for earning lpToken yield
            helixToken.address,             // chef reward token for yield
            feeHandler.address,             // treasury used for receiving buy/sell fees
            yieldSwapMinLockDuration,       // minimum length of time (in seconds) a swap can be locked for
            yieldSwapMaxLockDuration,       // maximum length of time (in seconds) a swap can be locked for
    )

    // 18 deploy lp swap contract with treasury address argument
    const lpSwap = await deployContract(wallet, LpSwap, [], overrides)

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
        helixNFT,
        helixChefNFT,
        helixNFTBridge,
        helixLP,
        helixLP2,
        swapRewards,
        externalFactory,
        externalRouter,
        migrator, 
        tokenTools,
        vault,
        vipPresale,
        publicPresale,
        airDrop,
        yieldSwap,
        lpSwap,
        feeHandler,
    }
}
