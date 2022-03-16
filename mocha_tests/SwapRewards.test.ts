import chai, { expect, use } from 'chai'
import { Contract, constants } from 'legacy-ethers'
import { solidity, loadFixture, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle'
import { BigNumber } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'
import { expandTo18Decimals } from './shared/utilities'

import AuraPair from '../build/contracts/AuraPair.json'
import Oracle from '../build/contracts/Oracle.json'
import SwapRewards from '../build/contracts/SwapRewards.json'
import { fullExchangeFixture } from './shared/swapRewardFixtures'

use(solidity)

const verbose = false
const gasLimit = 999999999

describe('SwapRewards', () => {
    let swapRewards: Contract
    let factory: Contract
    let router: Contract
    let oracleFactory: Contract
    let refReg: Contract
    let auraToken: Contract
    let auraNFT: Contract
    let apToken: Contract

    let tokenA: Contract
    let tokenB: Contract
    let tokenC: Contract
    let tokenD: Contract

    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })
    const [wallet, user] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet])

    beforeEach(async () => {
        // Load all the contracts used in creating swapRewards contract.
        const fixture = await loadFixture(fullExchangeFixture)
        swapRewards = fixture.swapRewards

        factory = fixture.factory
        router = fixture.router
        oracleFactory = fixture.oracleFactory
        refReg = fixture.refReg

        auraToken = fixture.auraToken
        auraNFT = fixture.auraNFT
        apToken = fixture.apToken

        tokenA = fixture.tokenA
        tokenB = fixture.tokenB

        await init(tokenA, tokenB)
    })

    async function init(token0: Contract, token1: Contract) {
        // factory must reference oracle factory before creating pairs
        await factory.setOracleFactory(oracleFactory.address)

        // router must reference swapRewards  
        await router.setSwapRewards(swapRewards.address)

        // initialize the valid swap pairs for the tokens 0, 1, Ap, and Aura
        const amount0 = expandTo18Decimals(900)
        const amount1 = expandTo18Decimals(300)
        const apAmount = expandTo18Decimals(800)
        const auraAmount = expandTo18Decimals(700)

        await initPair(token0, amount0, token1, amount1)
        await initPair(token0, amount0, apToken, apAmount)
        await initPair(token0, amount0, auraToken, auraAmount)

        await initPair(token1, amount1, apToken, apAmount)
        await initPair(token1, amount1, auraToken, auraAmount)

        await initPair(apToken, apAmount, auraToken, auraAmount)

        // refReg must recognize swapRewards as a recorder add a referrer for wallet
        await refReg.addRecorder(swapRewards.address)
        await refReg.addRef(user.address)

        // auraNFT must be initialized and recognize wallet as an accruer
        await auraNFT.initialize("BASEURI", expandTo18Decimals(10000), 20)
        await auraNFT.addAccruer(swapRewards.address)
        
        // swapFee must be registered with auraToken as a minter
        await auraToken.addMinter(swapRewards.address)
    }

    async function initPair(token0: Contract, amount0: BigNumber, token1: Contract, amount1: BigNumber) {
        await factory.createPair(token0.address, token1.address)

        await token0.approve(router.address, MaxUint256)
        await token1.approve(router.address, MaxUint256)

        await router.addLiquidity(
            token0.address, 
            token1.address, 
            amount0, 
            amount1, 
            0, 
            0, 
            wallet.address, 
            MaxUint256, 
            { gasLimit }
        )
    }

    it('swapRewards: output INIT CODE HASH', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`)
    })

    it('swapRewards: factory is initialized', async () => {
        // pairs are created
        expect(await factory.getPair(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero)
        expect(await factory.getPair(tokenB.address, apToken.address)).to.not.eq(constants.AddressZero)
        expect(await factory.getPair(tokenB.address, auraToken.address)).to.not.eq(constants.AddressZero)
    })

    it('swapRewards: oracle factory is initialized', async () => {
        // oracle pairs are created
        expect(await oracleFactory.getOracle(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero)
        expect(await oracleFactory.getOracle(tokenB.address, apToken.address)).to.not.eq(constants.AddressZero)
        expect(await oracleFactory.getOracle(tokenB.address, auraToken.address)).to.not.eq(constants.AddressZero)
    })

    it('swapRewards: router is initialized', async () => {
        expect(await router.factory()).to.eq(factory.address)
        expect(await router.swapRewards()).to.eq(swapRewards.address)
    })

    it('swapRewards: pair (A, B) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        let pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: pair (B, AP) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenB.address, apToken.address)
        let pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: pair (B, AURA) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenB.address, auraToken.address)
        let pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: referral register is initialized', async () => {
        expect(await refReg.ref(wallet.address)).to.eq(user.address)
        expect(await refReg.isRecorder(swapRewards.address)).to.be.true
    })

    it('swapRewards: auraNFT is initialized', async () => {
        expect(await auraNFT.isAccruer(swapRewards.address)).to.be.true
    })

    it('swapRewards: aura token is initialized', async () => {
        expect(await auraToken.isMinter(swapRewards.address)).to.be.true
    })

    it('swapRewards: split amount is correct', async () => {
        await swapRewards.setSplitRewardPercent(50)     // 5% Aura and 95% Ap
        let [auraAmount0, apAmount0] = await swapRewards.splitReward(100)
        expect(auraAmount0).to.eq(5)
        expect(apAmount0).to.eq(95)

        await swapRewards.setSplitRewardPercent(150)    // 15% Aura and 85% Ap
        let [auraAmount1, apAmount1] = await swapRewards.splitReward(100)
        expect(auraAmount1).to.eq(15)
        expect(apAmount1).to.eq(85)

        await swapRewards.setSplitRewardPercent(500)    // 50% Aura and 50% Ap
        let [auraAmount2, apAmount2] = await swapRewards.splitReward(100)
        expect(auraAmount2).to.eq(50)
        expect(apAmount2).to.eq(50)
    })

    it('swapRewards: swap tokens from swapRewards', async () => {
        // This test is used as a sanity check to make sure that no errors
        // are occuring in swapRewards before calling swapRewards from router.

        const account = wallet.address
        const referrer = user.address

        // Mimic the wallet as the router
        await swapRewards.setRouter(account)

        // Store the previous values of interest before swap 
        const prevAccountAura = await auraToken.balanceOf(account)
        const prevAccountAp = await auraNFT.getAccumulatedAP(account)
        const prevReferrerAura = await refReg.balance(referrer)

        // Swap A for B and collect rewards
        await swapRewards.swap(account, tokenA.address, tokenB.address, 1000)

        // Get the updated values after swap
        const newAccountAura = await auraToken.balanceOf(account)
        const newAccountAp = await auraNFT.getAccumulatedAP(account)
        const newReferrerAura = await refReg.balance(referrer)

        print(`account Aura was ${prevAccountAura} and now is ${newAccountAura}`)
        print(`account Ap was ${prevAccountAp} and now is ${newAccountAp}`)
        print(`referrer Aura was ${prevReferrerAura} and now is ${newReferrerAura}`)

        // We don't actually expect any rewards to accrue because a swap hasn't been triggered.
        expect(prevAccountAura).to.be.at.most(newAccountAura)
        expect(prevAccountAp).to.be.at.most(newAccountAp)
        expect(prevReferrerAura).to.be.at.most(newReferrerAura)
    })

    it('swapRewards: swap tokens from router', async () => {
        const account = wallet.address
        const referrer = user.address

        // Store the previous values of interest before swap 
        const prevAccountAura = await auraToken.balanceOf(account)
        const prevAccountAp = await auraNFT.getAccumulatedAP(account)
        const prevReferrerAura = await refReg.balance(referrer)

        // Swap twice and earn rewards
        await router.swapExactTokensForTokens(
            expandTo18Decimals(100), 
            0, 
            [tokenA.address, tokenB.address], 
            wallet.address, 
            MaxUint256,
            { gasLimit }
        )
            
        await router.swapExactTokensForTokens(
            expandTo18Decimals(90), 
            0, 
            [tokenB.address, apToken.address], 
            wallet.address, 
            MaxUint256,
            { gasLimit }
        )

        await router.swapExactTokensForTokens(
            expandTo18Decimals(90), 
            0, 
            [tokenB.address, auraToken.address], 
            wallet.address, 
            MaxUint256,
            { gasLimit }
        )

        // Get the updated values after swap
        const newAccountAura = await auraToken.balanceOf(account)
        const newAccountAp = await auraNFT.getAccumulatedAP(account)
        const newReferrerAura = await refReg.balance(referrer)

        print(`account Aura was ${prevAccountAura} and now is ${newAccountAura}`)
        print(`account Ap was ${prevAccountAp} and now is ${newAccountAp}`)
        print(`referrer Aura was ${prevReferrerAura} and now is ${newReferrerAura}`)

        expect(prevAccountAura).to.be.at.most(newAccountAura)
        expect(prevAccountAp).to.be.at.most(newAccountAp)
        expect(prevReferrerAura).to.be.at.most(newReferrerAura)
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
