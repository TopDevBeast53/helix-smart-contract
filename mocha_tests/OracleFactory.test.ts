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
    const [wallet0, wallet1] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

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
        // expect call to fail since msg.sender == wallet1.address
        const _oracleFactory = new Contract(oracleFactory.address, JSON.stringify(OracleFactory.abi), provider)
            .connect(wallet1) 
        await expect(_oracleFactory.create(tokenB.address, tokenC.address))
            .to.be.revertedWith('OracleFactory: invalid caller')
    })

    it('oracleFactory: create oracle for token pair (B, C)', async () => {
        // create pair (B, C)
        await factory.createPair(tokenB.address, tokenC.address)
        const oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        expect(oracle.token0).to.not.eq(constants.AddressZero)
    })

    it('oracleFactory: create oracle populates mapping both ways with same oracle address', async () => {
        await factory.createPair(tokenB.address, tokenC.address)

        const oracleB_C = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        const oracleC_B = await oracleFactory.getOracle(tokenC.address, tokenB.address)

        expect(oracleB_C.token0).to.eq(oracleC_B.token0)
        expect(oracleB_C.token1).to.eq(oracleC_B.token1)
    })

    it('oracleFactory: create oracle emits Created event', async () => {
        await expect(factory.createPair(tokenC.address, tokenD.address))
            .to.emit(oracleFactory, "Created")
            .withArgs(
                tokenD.address,
                tokenC.address,
                0,
                0
            )
    })

    it('oracleFactory: update when oracle not created fails', async () => {
        await expect(oracleFactory.update(tokenB.address, tokenC.address))
            .to.be.revertedWith('OracleFactory: not created')
    })

    it('oracleFactory: update with no reserves fails', async () => {
        await factory.createPair(tokenB.address, tokenC.address)
        await expect(oracleFactory.update(tokenB.address, tokenC.address))
            .to.be.revertedWith('OracleFactory: no reserves in pair')
    })

    it('oracleFactory: update changes the oracle blockTimestamp', async () => {
        await factory.createPair(tokenB.address, tokenC.address)

        // need an instance of the oracle to get it's prices before and after update is called
        const oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)

        // store the previous oracle state to compare against the updated state
        const prevTimestamp = await oracle.blockTimestampLast;
        expect(prevTimestamp).to.eq(0)   // since update hasn't been called

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        await swap(tokenB, tokenC, 40)

        // check the pair reserves
        const pairAddress = await factory.getPair(tokenB.address, tokenC.address)
        const pair = new Contract(pairAddress, JSON.stringify(HelixPair.abi), provider)
            .connect(wallet0) 
        print(`reserves ${await pair.getReserves()}`)

        expect(await oracle.blockTimestampLast).to.be.above(prevTimestamp)
    })

    it('oracleFactory: update only changes the state once per period', async () => {
        await factory.createPair(tokenB.address, tokenC.address)
        
        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        await swap(tokenB, tokenC, 40)

        // need an instance of the oracle to get it's prices before and after update is called
        let oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)

        // store the initial prices after the first swap
        const initPrice0 = await oracle.price0CumulativeLast
        const initPrice1 = await oracle.price1CumulativeLast
    
        // perform a second swap before the required time has elapsed
        await swap(tokenB, tokenC, 40)

        // the price should not have been updated because insufficient time has passed to update again
        oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        expect(await oracle.price0CumulativeLast).to.eq(initPrice0)
        expect(await oracle.price1CumulativeLast).to.eq(initPrice1)
    })

    it('oracleFactory: update emits Updated event', async () => {
        await factory.createPair(tokenB.address, tokenC.address)

        // need an instance of the oracle to get it's prices before and after update is called
        const oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        
        const expectedPrice0 = 0;
        const expectedPrice1 = 0;
        const expectedReserve0 = '400000000000000000000';
        const expectedReserve1 = '750375187593796898450';
        
        // perform the swap 
        await expect(router.swapExactTokensForTokens(
            expandTo18Decimals(100), 
            0, 
            [tokenC.address, tokenB.address], 
            wallet0.address, 
            MaxUint256,
            overrides
        ))
            .to.emit(oracleFactory, 'Updated')
            .withArgs(
                tokenC.address, 
                tokenB.address, 
                expectedPrice0,
                expectedPrice1,
                expectedReserve0, 
                expectedReserve1
            )
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
        expect((await oracleFactory.getOracle(tokenA.address, tokenB.address)).token0).to.not.eq(constants.AddressZero)
    })
    
    it('oracleFactory: get oracle argument order doesn\'t matter', async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        expect((await oracleFactory.getOracle(tokenB.address, tokenA.address)).token0).to.not.eq(constants.AddressZero)
    })

    it('oracleFactory: get oracle that hasn\'t been created fails', async () => {
        await expect(oracleFactory.getOracle(tokenA.address, tokenA.address))
            .to.be.revertedWith("OracleFactory: not created")
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
            wallet0.address,
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
            wallet0.address, 
            MaxUint256,
            overrides
        )
    }
})
