import chai, { expect, use } from 'chai'
import { Contract, constants } from 'legacy-ethers'
import { solidity, loadFixture, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle'
import { BigNumber } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'
import { expandTo18Decimals } from './shared/utilities'

import HelixPair from '../build/contracts/HelixPair.json'
import SwapRewards from '../build/contracts/SwapRewards.json'
import { fullExchangeFixture } from './shared/fixtures'

use(solidity)

const verbose = false
const gasLimit = 999999999

describe('SwapRewards', () => {
    let swapRewards: Contract
    let factory: Contract
    let router: Contract
    let oracleFactory: Contract
    let refReg: Contract
    let helixToken: Contract
    let helixNFT: Contract
    let helixLP: Contract

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

        factory = fixture.factory
        router = fixture.router
        oracleFactory = fixture.oracleFactory
        refReg = fixture.refReg
        swapRewards = fixture.swapRewards

        helixToken = fixture.helixToken
        helixNFT = fixture.helixNFT
        helixLP = fixture.helixLP

        tokenA = fixture.tokenA
        tokenB = fixture.tokenB

        await initPairs(tokenA, tokenB)

        // Add the user as the wallet's referrer
        await refReg.addRef(user.address)
    })

    async function initPairs(token0: Contract, token1: Contract) {
        // initialize all the valid swap pairs for the tokens 0, 1, Hp, and Helix
        const amount0 = expandTo18Decimals(900)
        const amount1 = expandTo18Decimals(300)
        const hpAmount = expandTo18Decimals(800)
        const helixAmount = expandTo18Decimals(700)

        await initPair(token0, amount0, token1, amount1)
        await initPair(token0, amount0, helixLP, hpAmount)
        await initPair(token0, amount0, helixToken, helixAmount)

        await initPair(token1, amount1, helixLP, hpAmount)
        await initPair(token1, amount1, helixToken, helixAmount)

        await initPair(helixLP, hpAmount, helixToken, helixAmount)
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
        expect(await factory.getPair(tokenB.address, helixLP.address)).to.not.eq(constants.AddressZero)
        expect(await factory.getPair(tokenB.address, helixToken.address)).to.not.eq(constants.AddressZero)
    })

    it('swapRewards: oracle factory is initialized', async () => {
        // oracle pairs are created
        expect(await oracleFactory.getOracle(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero)
        expect(await oracleFactory.getOracle(tokenB.address, helixLP.address)).to.not.eq(constants.AddressZero)
        expect(await oracleFactory.getOracle(tokenB.address, helixToken.address)).to.not.eq(constants.AddressZero)
    })

    it('swapRewards: router is initialized', async () => {
        expect(await router.factory()).to.eq(factory.address)
        expect(await router.swapRewards()).to.eq(swapRewards.address)
    })

    it('swapRewards: pair (A, B) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        let pair = new Contract(pairAddress, JSON.stringify(HelixPair.abi), provider).connect(wallet)
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: pair (B, HP) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenB.address, helixLP.address)
        let pair = new Contract(pairAddress, JSON.stringify(HelixPair.abi), provider).connect(wallet)
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: pair (B, HELIX) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenB.address, helixToken.address)
        let pair = new Contract(pairAddress, JSON.stringify(HelixPair.abi), provider).connect(wallet)
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: referral register is initialized', async () => {
        expect(await refReg.ref(wallet.address)).to.eq(user.address)
        expect(await refReg.isRecorder(swapRewards.address)).to.be.true
    })

    it('swapRewards: helixNFT is initialized', async () => {
        expect(await helixNFT.isAccruer(swapRewards.address)).to.be.true
    })

    it('swapRewards: helix token is initialized', async () => {
        expect(await helixToken.isMinter(swapRewards.address)).to.be.true
    })

    it('swapRewards: split amount is correct', async () => {
        await swapRewards.setSplitRewardPercent(5)     // 5% Helix and 95% Hp
        let [helixAmount0, hpAmount0] = await swapRewards.splitReward(100)
        expect(helixAmount0).to.eq(5)
        expect(hpAmount0).to.eq(95)

        await swapRewards.setSplitRewardPercent(15)    // 15% Helix and 85% Hp
        let [helixAmount1, hpAmount1] = await swapRewards.splitReward(100)
        expect(helixAmount1).to.eq(15)
        expect(hpAmount1).to.eq(85)

        await swapRewards.setSplitRewardPercent(50)    // 50% Helix and 50% Hp
        let [helixAmount2, hpAmount2] = await swapRewards.splitReward(100)
        expect(helixAmount2).to.eq(50)
        expect(hpAmount2).to.eq(50)
    })

    it('swapRewards: swap tokens from swapRewards', async () => {
        // This test is used as a sanity check to make sure that no errors
        // are occuring in swapRewards before calling swapRewards from router.

        const account = wallet.address
        const referrer = user.address

        // Mimic the wallet as the router
        await swapRewards.setRouter(account)

        // Store the previous values of interest before swap 
        const prevAccountHelix = await helixToken.balanceOf(account)
        const prevAccountHp = await helixNFT.getAccumulatedHP(account)
        const prevReferrerHelix = await refReg.balance(referrer)

        // Swap A for B and collect rewards
        await swapRewards.swap(account, tokenA.address, tokenB.address, 1000)

        // Get the updated values after swap
        const newAccountHelix = await helixToken.balanceOf(account)
        const newAccountHp = await helixNFT.getAccumulatedHP(account)
        const newReferrerHelix = await refReg.balance(referrer)

        print(`account Helix was ${prevAccountHelix} and now is ${newAccountHelix}`)
        print(`account Hp was ${prevAccountHp} and now is ${newAccountHp}`)
        print(`referrer Helix was ${prevReferrerHelix} and now is ${newReferrerHelix}`)

        // We don't actually expect any rewards to accrue because a swap hasn't been triggered.
        expect(prevAccountHelix).to.be.at.most(newAccountHelix)
        expect(prevAccountHp).to.be.at.most(newAccountHp)
        expect(prevReferrerHelix).to.be.at.most(newReferrerHelix)
    })

    it('swapRewards: swap tokens from router', async () => {
        const account = wallet.address
        const referrer = user.address

        // Store the previous values of interest before swap 
        const prevAccountHelix = await helixToken.balanceOf(account)
        const prevAccountHp = await helixNFT.getAccumulatedHP(account)
        const prevReferrerHelix = await refReg.balance(referrer)

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
            [tokenB.address, helixLP.address], 
            wallet.address, 
            MaxUint256,
            { gasLimit }
        )

        await router.swapExactTokensForTokens(
            expandTo18Decimals(90), 
            0, 
            [tokenB.address, helixToken.address], 
            wallet.address, 
            MaxUint256,
            { gasLimit }
        )

        // Get the updated values after swap
        const newAccountHelix = await helixToken.balanceOf(account)
        const newAccountHp = await helixNFT.getAccumulatedHP(account)
        const newReferrerHelix = await refReg.balance(referrer)

        print(`account Helix was ${prevAccountHelix} and now is ${newAccountHelix}`)
        print(`account Hp was ${prevAccountHp} and now is ${newAccountHp}`)
        print(`referrer Helix was ${prevReferrerHelix} and now is ${newReferrerHelix}`)

        expect(prevAccountHelix).to.be.at.most(newAccountHelix)
        expect(prevAccountHp).to.be.at.most(newAccountHp)
        expect(prevReferrerHelix).to.be.at.most(newReferrerHelix)
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
