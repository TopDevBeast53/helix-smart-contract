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

    it('oracleFactory: initialized with expected values', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`)
        expect(await factory.oracleFactory()).to.eq(oracleFactory.address)
        expect(await oracleFactory.factory()).to.eq(factory.address)
        expect(await oracleFactory.period()).to.eq(86400) // 24 hours * 60 seconds
    })

    it('oracleFactory: create oracle with invalid token address fails', async () => {
        const invalidToken0Address = constants.AddressZero
        const invalidToken1Address = constants.AddressZero

        await expect(oracleFactory.create(invalidToken0Address, tokenB.address))
            .to.be.revertedWith('OracleFactory: zero address')

        await expect(oracleFactory.create(invalidToken0Address, tokenB.address))
            .to.be.revertedWith('OracleFactory: zero address')
    })

    it('oracleFactory: create oracle as non-owner/non-factory fails', async () => {
        // expect call to fail since msg.sender == wallet1.address
        const _oracleFactory = new Contract(oracleFactory.address, JSON.stringify(OracleFactory.abi), provider)
            .connect(wallet1) 
        await expect(_oracleFactory.create(tokenB.address, tokenC.address))
            .to.be.revertedWith('OracleFactory: invalid caller')
    })

    it('oracleFactory: create oracle with identical token addresses fails', async () => {
        await expect(oracleFactory.create(tokenA.address, tokenA.address))
            .to.be.revertedWith('OracleFactory: identical addresses')
    })
    
    it('oracleFactory: create oracle when oracle already exists fails', async () => {
        // Call as factory first since pair has to be created in factory to avoid revert
        await factory.createPair(tokenA.address, tokenB.address)
        await expect(oracleFactory.create(tokenA.address, tokenB.address))
            .to.be.revertedWith('OracleFactory: already created')
    })
    
    it('oracleFactory: create oracle', async () => {
        // create the oracle
        await factory.createPair(tokenB.address, tokenC.address)
    
        // check the oracle state is set
        const oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        expect(oracle.token0).to.eq(tokenC.address)     // 0 == C because C < B
        expect(oracle.token1).to.eq(tokenB.address)     // 1 == B because B > C
        expect(oracle.price0CumulativeLast).to.eq(0)    // because only set by update and update not called
        expect(oracle.price1CumulativeLast).to.eq(0)    // because only set by update and update not called

        // check the mapping is populated in both directions
        const oracle0 = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        const oracle1 = await oracleFactory.getOracle(tokenC.address, tokenB.address)
        expect(oracle0.token0).to.eq(oracle1.token0)
        expect(oracle0.token1).to.eq(oracle1.token1)
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

    it('oracleFactory: update updates oracle state', async () => {
        // create the pair/oracle
        await factory.createPair(tokenB.address, tokenC.address)

        // get the oracle to check it's state before and after update is called
        const prevOracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)

        expect(prevOracle.token0).to.eq(tokenC.address)
        expect(prevOracle.token1).to.eq(tokenB.address)
        // expect all the following to eq 0 since update hasn't been called
        expect(prevOracle.price0CumulativeLast).to.eq(0)
        expect(prevOracle.price1CumulativeLast).to.eq(0)
        expect(prevOracle.blockTimestampLast).to.eq(0) 
        expect(prevOracle.price0Average[0]).to.eq(0)
        expect(prevOracle.price1Average[0]).to.eq(0)

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        await swap(tokenB, tokenC, 40)
        
        // wait until the block timestamp has advanced
        const waitDuration = 2  // seconds
        await waitUntil(await now() + waitDuration)

        // update the oracle
        await oracleFactory.update(tokenB.address, tokenC.address)

        // get the updated oracle
        const oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)

        expect(oracle.token0).to.eq(tokenC.address)
        expect(oracle.token1).to.eq(tokenB.address)
        // expect all the following to eq 0 since update hasn't been called
        expect(oracle.price0CumulativeLast).to.eq("56155562830926394653497785986352713")
        expect(oracle.price1CumulativeLast).to.eq("4320845661094996273461366439858029")
        expect(oracle.blockTimestampLast).to.be.eq(await now()) 
    })

    it('oracleFactory: update only changes the state once per period', async () => {
        // create the pair/oracle
        await factory.createPair(tokenB.address, tokenC.address)

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        await swap(tokenB, tokenC, 40)
        
        // wait until the block timestamp has advanced
        const waitDuration = 2  // seconds
        await waitUntil(await now() + waitDuration)

        // update the oracle
        await oracleFactory.update(tokenB.address, tokenC.address)

        // check the updated oracle
        const prevOracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        expect(prevOracle.token0).to.eq(tokenC.address)
        expect(prevOracle.token1).to.eq(tokenB.address)
        // expect all the following to eq 0 since update hasn't been called
        expect(prevOracle.price0CumulativeLast).to.eq("56155562830926394653497785986352713")
        expect(prevOracle.price1CumulativeLast).to.eq("4320845661094996273461366439858029")
        const expectedTimestamp = await now()
        expect(prevOracle.blockTimestampLast).to.be.eq(expectedTimestamp) 

        // try to update again
        // wait until the block timestamp has advanced
        await waitUntil(await now() + waitDuration)

        // update the oracle
        await oracleFactory.update(tokenB.address, tokenC.address)

        // check the updated oracle and expect that it has not been updated
        const oracle = await oracleFactory.getOracle(tokenB.address, tokenC.address)
        expect(oracle.token0).to.eq(tokenC.address)
        expect(oracle.token1).to.eq(tokenB.address)
        // expect all the following to eq 0 since update hasn't been called
        expect(oracle.price0CumulativeLast).to.eq("56155562830926394653497785986352713")
        expect(oracle.price1CumulativeLast).to.eq("4320845661094996273461366439858029")
        expect(oracle.blockTimestampLast).to.be.eq(expectedTimestamp) 
    })

    it('oracleFactory: update emits Updated event', async () => {
        // create the pair/oracle
        await factory.createPair(tokenB.address, tokenC.address)

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenB, 1000, tokenC, 300)
        await swap(tokenB, tokenC, 40)
        
        // wait until the block timestamp has advanced
        const waitDuration = 2  // seconds
        await waitUntil(await now() + waitDuration)

        const expectedPrice0 = "56155562830926394653497785986352713"
        const expectedPrice1 = "4320845661094996273461366439858029"
        const expectedReserve0 = '288483729517655204247'
        const expectedReserve1 = '1040000000000000000000'
        
        // update the oracle
        await expect(oracleFactory.update(tokenB.address, tokenC.address))
            .to.emit(oracleFactory, 'Updated')
            .withArgs(
                tokenB.address, 
                tokenC.address, 
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

    // return the current timestamp
    async function now() {
        return (await provider.getBlock(provider.getBlockNumber())).timestamp
    }

    // perform dummy writes to the contract until the desired timestamp is reached
    async function waitUntil(timestamp: number) {
        // wait until timestamp is passed
        while (await now() <= timestamp) {
            await oracleFactory.setPeriod(86000)
        }
    }
})
