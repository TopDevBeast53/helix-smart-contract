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
        await refReg.addReferrer(user.address)
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
        expect(await refReg.referrers(wallet.address)).to.eq(user.address)
        expect(await refReg.isRecorder(swapRewards.address)).to.be.true
    })

    it('swapRewards: swap when paused fails', async () => {
        await swapRewards.pause();

        const account = wallet.address
        const referrer = user.address

        // Mimic the wallet as the router
        await swapRewards.setRouter(account)

        // Store the previous values of interest before swap 
        const prevAccountHelix = await helixToken.balanceOf(account)
        const prevReferrerHelix = await refReg.rewards(referrer)

        // Swap A for B and collect rewards
        await expect(swapRewards.swap(account, tokenB.address, 1000))
            .to.be.revertedWith("Pausable: paused")
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
        const prevReferrerHelix = await refReg.rewards(referrer)

        // Swap A for B and collect rewards
        await swapRewards.swap(account, tokenB.address, 1000)

        // Get the updated values after swap
        const newAccountHelix = await helixToken.balanceOf(account)
        const newReferrerHelix = await refReg.rewards(referrer)

        // We don't actually expect any rewards to accrue because a swap hasn't been triggered.
        expect(prevAccountHelix).to.be.at.most(newAccountHelix)
        expect(prevReferrerHelix).to.be.at.most(newReferrerHelix)
    })

    it('swapRewards: swap tokens from router', async () => {
        const account = wallet.address
        const referrer = user.address

        // Store the previous values of interest before swap 
        const prevAccountHelix = await helixToken.balanceOf(account)
        const prevReferrerHelix = await refReg.rewards(referrer)

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
        const newReferrerHelix = await refReg.rewards(referrer)

        expect(prevAccountHelix).to.be.at.most(newAccountHelix)
        expect(prevReferrerHelix).to.be.at.most(newReferrerHelix)
    })
    
    function print(str: string) {
        if (verbose) console.log(str)
    }
})
