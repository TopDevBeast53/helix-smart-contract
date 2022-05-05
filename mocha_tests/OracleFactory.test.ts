import chai, { expect, use } from 'chai'
import { Contract, constants } from 'legacy-ethers'
import { solidity, loadFixture, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle'
import { BigNumber } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'
import { expandTo18Decimals } from './shared/utilities'

import HelixPair from '../build/contracts/HelixPair.json'
import Oracle from '../build/contracts/Oracle.json'
import OracleFactory from '../build/contracts/OracleFactory.json'
import SwapRewards from '../build/contracts/SwapRewards.json'
import { fullExchangeFixture } from './shared/fixtures'

use(solidity)

const verbose = true
const overrides = {
    gasLimit: 9999999
}

describe('OracleFactory', () => {
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
        swapRewards = fixture.swapRewards

        factory = fixture.factory
        router = fixture.router
        oracleFactory = fixture.oracleFactory
        refReg = fixture.refReg

        helixToken = fixture.helixToken
        helixNFT = fixture.helixNFT
        helixLP = fixture.helixLP

        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
        tokenC = fixture.tokenC
        tokenD = fixture.tokenD
    })

    it('oracleFactory: output INIT CODE HASH', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`)
    })

    it('oracleFactory: factory is initialized', async () => {
        expect(await factory.oracleFactory()).to.eq(oracleFactory.address)
    })

    it('oracleFactory: oracleFactory is initialized', async () => {
        expect(await oracleFactory.factory()).to.eq(factory.address)
    })

    it('oracleFactory: create duplicate oracle', async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        await expect(oracleFactory.create(tokenA.address, tokenB.address))
            .to.be.revertedWith('OracleFactory: oracle was already created');
    })

    it('oracleFactory: create can only be called by factory', async () => {
        // expect call to fail since msg.sender == wallet.address
        await expect(oracleFactory.create(tokenB.address, tokenC.address))
            .to.be.revertedWith('OracleFactory: caller is not factory')
    })

    it('oracleFactory: create oracle for token pair (B, C)', async () => {
        // create pair (B, C)
        await factory.createPair(tokenB.address, tokenC.address)
        expect(await oracleFactory.getOracle(tokenB.address, tokenC.address)).to.not.eq(constants.AddressZero)
    })

    it('oracleFactory: create oracle populates mapping both ways with same oracle address', async () => {
        await factory.createPair(tokenB.address, tokenC.address)

        const oracleB_C = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        const oracleC_B = await oracleFactory.getOracle(tokenC.address, tokenB.address)

        expect(oracleB_C).to.eq(oracleC_B)
    })

    it('oracleFactory: create oracle produces viable oracle object', async () => {
        // tests whether a created oracle by oracle factory can be deployed and have it's functions called 
        await factory.createPair(tokenB.address, tokenC.address)

        const oracleAddress = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        const oracle = new Contract(oracleAddress, JSON.stringify(Oracle.abi), provider).connect(wallet) 

        // consider it sufficient to check that the oracle has token0 and token1 assigned
        // note that token0 == tokenC and token1 == tokenB because factory.createPair sorts the tokens
        expect(await oracle.token0()).to.eq(tokenC.address)
        expect(await oracle.token1()).to.eq(tokenB.address)
    })
    
    it('oracleFactory: create oracle emits Create event', async () => {
        await expect(factory.createPair(tokenC.address, tokenD.address))
            .to.emit(oracleFactory, "Create")
            .withArgs(
                tokenD.address,
                tokenC.address,
                '0x36f04D4aEE9c3d382cBf17B6f650BCd5F63679d6'
        )
    })

    it('oracleFactory: update fails if oracle hasn\'t been created', async () => {
        await expect(oracleFactory.update(tokenB.address, tokenC.address))
            .to.be.revertedWith('OracleFactory: oracle has not been created')
    })

    it('oracleFactory: update fails if the pair has no reserves', async () => {
        await factory.createPair(tokenB.address, tokenC.address)
        await expect(oracleFactory.update(tokenB.address, tokenC.address))
            .to.be.revertedWith('Oracle: no reserves in pair')
    })

    it('oracleFactory: update changes the oracle state', async () => {
        await factory.createPair(tokenB.address, tokenC.address)

        // need an instance of the oracle to get it's prices before and after update is called
        const oracleAddress = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        const oracle = new Contract(oracleAddress, JSON.stringify(Oracle.abi), provider).connect(wallet) 

        // store the previous oracle state to compare against the updated state
        const prevTimestamp = await oracle.blockTimestampLast();

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        await swap(tokenB, tokenC, 40)
        
        // the time at which the test was written
        // if it's been updated then the new timestamp must larger than this value
        const minTimestamp = 1647311426 
        expect(await oracle.blockTimestampLast()).to.be.above(minTimestamp)
        expect(await oracle.blockTimestampLast()).to.be.above(prevTimestamp)
    })

    it('oracleFactory: update only changes the state once per period', async () => {
        await factory.createPair(tokenB.address, tokenC.address)

        // need an instance of the oracle to get it's prices before and after update is called
        const oracleAddress = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        const oracle = new Contract(oracleAddress, JSON.stringify(Oracle.abi), provider).connect(wallet) 

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        await swap(tokenB, tokenC, 40)

        // store the initial prices after the first swap
        const initPrice0 = await oracle.price0CumulativeLast()
        const initPrice1 = await oracle.price1CumulativeLast()

        // perform a secont swap before the required time has elapsed
        await swap(tokenB, tokenC, 40)

        // the price should not have been updated because insufficient time has passed to update again
        expect(await oracle.price0CumulativeLast()).to.eq(initPrice0)
        expect(await oracle.price1CumulativeLast()).to.eq(initPrice1)
    })

    it('oracleFactory: update emits Update event', async () => {
        await factory.createPair(tokenB.address, tokenC.address)

        // need an instance of the oracle to get it's prices before and after update is called
        const oracleAddress = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        const oracle = new Contract(oracleAddress, JSON.stringify(Oracle.abi), provider).connect(wallet) 

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        
        // perform the swap 
        await expect(router.swapExactTokensForTokens(
            expandTo18Decimals(100), 
            0, 
            [tokenC.address, tokenB.address], 
            wallet.address, 
            MaxUint256,
            overrides
        ))
            .to.emit(oracleFactory, 'Update')
            .withArgs(tokenC.address, tokenB.address, Math.trunc(Date.now() / 1000))
    })

    it('oracleFactory: consult returns amount in if oracle doesn\'t exist', async () => {
        expect(await oracleFactory.consult(tokenB.address, 0, tokenC.address)).to.eq(0)
        expect(await oracleFactory.consult(tokenB.address, 10000, tokenC.address)).to.eq(10000)
        expect(await oracleFactory.consult(tokenB.address, MaxUint256, tokenC.address)).to.eq(MaxUint256)
    })

    it('oracleFactory: consult returns prices if oracle exists', async () => {
        await prepareForSwap(tokenA, 1000, tokenB, 300)
        await swap(tokenA, tokenB, 100)
        expect(await oracleFactory.consult(tokenA.address, 40, tokenB.address)).to.be.at.least(0)
    })

    it('oracleFactory: get oracle for token pair (A, B)', async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        expect(await oracleFactory.getOracle(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero)
    })
    
    it('oracleFactory: get oracle argument order doesn\'t matter', async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        expect(await oracleFactory.getOracle(tokenB.address, tokenA.address)).to.not.eq(constants.AddressZero)
    })

    it('oracleFactory: get oracle that hasn\'t been created returns address 0', async () => {
        expect(await oracleFactory.getOracle(tokenA.address, tokenA.address)).to.eq(constants.AddressZero)
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }

    // prepare the tokens and the pool to swap
    async function prepareForSwap(token0: Contract, amount0: number, token1: Contract, amount1: number) {
        // must approve tokens before they can be added as liquidity
        await token0.approve(router.address, MaxUint256)
        await token1.approve(router.address, MaxUint256)

        // must add liquidity so that there are reserves of each token in pair
        await router.addLiquidity(
            token0.address,
            token1.address,
            expandTo18Decimals(amount0),
            expandTo18Decimals(amount1),
            0,
            0,
            wallet.address,
            MaxUint256,
            overrides 
        )
    }
    
    async function swap(token0: Contract, token1: Contract, amount: number) {
        // swap the tokens so that oracle.update is called
        await router.swapExactTokensForTokens(
            expandTo18Decimals(amount), 
            0, 
            [token0.address, token1.address], 
            wallet.address, 
            MaxUint256,
            overrides
        )
    }
})
