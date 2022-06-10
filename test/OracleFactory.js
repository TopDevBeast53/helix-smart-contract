const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { bigNumberify } = require("legacy-ethers/utils")
const { expandTo18Decimals } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")

const { constants } = require("@openzeppelin/test-helpers")

const verbose = true

describe('OracleFactory', () => {
    let provider 

    let swapRewards
    let factory
    let router
    let oracleFactory
    let refReg
    let helixToken
    let helixNFT
    let helixLP

    let tokenA
    let tokenB
    let tokenC
    let tokenD

    let wallet0, wallet1

    let oracleFactory1

    beforeEach(async () => {
        [wallet0, wallet1] = await ethers.getSigners()

        // Load all the contracts used in creating swapRewards contract.
        const fixture = await loadFixture(fullExchangeFixture)

        factory = fixture.factory
        router = fixture.router
        oracleFactory = fixture.oracleFactory
        swapRewards = fixture.swapRewards
        refReg = fixture.refReg

        helixToken = fixture.helixToken
        helixNFT = fixture.helixNFT
        helixLP = fixture.helixLP

        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
        tokenC = fixture.tokenC
        tokenD = fixture.tokenD

        oracleFactory1 = await oracleFactory.connect(wallet1)
    })

    it('oracleFactory: initialized with expected values', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`)
        expect(await factory.oracleFactory()).to.eq(oracleFactory.address)
        expect(await oracleFactory.factory()).to.eq(factory.address)
        expect(await oracleFactory.period()).to.eq(86400) // 24 hours * 60 seconds
    })

    it('oracleFactory: create oracle with invalid token address fails', async () => {
        const invalidToken0Address = constants.ZERO_ADDRESS
        const invalidToken1Address = constants.ZERO_ADDRESS

        await expect(oracleFactory.create(invalidToken0Address, tokenB.address))
            .to.be.revertedWith("ZeroAddress()")

        await expect(oracleFactory.create(invalidToken0Address, tokenB.address))
            .to.be.revertedWith("ZeroAddress()")
    })

    it('oracleFactory: create oracle as non-owner/non-factory fails', async () => {
        // expect call to fail since msg.sender == wallet1.address
        await expect(oracleFactory1.create(tokenA.address, tokenB.address))
            .to.be.revertedWith(`InvalidCaller(\"${wallet1.address}\")`)
    })

    it('oracleFactory: create oracle with identical token addresses fails', async () => {
        await expect(oracleFactory.create(tokenA.address, tokenA.address))
            .to.be.revertedWith("IdenticalTokens()")
    })

    it('oracleFactory: create oracle when oracle already exists fails', async () => {
        // Call as factory first since pair has to be created in factory to avoid revert
        await factory.createPair(tokenA.address, tokenB.address)
        await expect(oracleFactory.create(tokenA.address, tokenB.address))
            .to.be.revertedWith(`OracleExists(\"${tokenA.address}\", \"${tokenB.address}\")`)
    })

    it('oracleFactory: create oracle', async () => {
        // create the oracle
        await factory.createPair(tokenA.address, tokenB.address)

        // check the oracle state is set
        const oracle = await oracleFactory.getOracle(tokenA.address, tokenB.address)
        expect(oracle.token0).to.eq(tokenB.address)     // 0 == C because C < B
        expect(oracle.token1).to.eq(tokenA.address)     // 1 == B because B > C
        expect(oracle.price0CumulativeLast).to.eq(0)    // because only set by update and update not called
        expect(oracle.price1CumulativeLast).to.eq(0)    // because only set by update and update not called

        // check the mapping is populated in both directions
        const oracle0 = await oracleFactory.getOracle(tokenA.address, tokenB.address)
        const oracle1 = await oracleFactory.getOracle(tokenB.address, tokenA.address)
        expect(oracle0.token0).to.eq(oracle1.token0)
        expect(oracle0.token1).to.eq(oracle1.token1)
    })

    it('oracleFactory: create oracle emits Create event', async () => {
        await expect(factory.createPair(tokenA.address, tokenB.address))
            .to.emit(oracleFactory, "Create")
    })

    it('oracleFactory: update when oracle not created fails', async () => {
        await expect(oracleFactory.update(tokenA.address, tokenB.address))
            .to.be.revertedWith(`OracleDoesNotExist(\"${tokenA.address}\", \"${tokenB.address}\")`)
    })

    it('oracleFactory: update with no reserves fails', async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        await expect(oracleFactory.update(tokenA.address, tokenB.address))
            .to.be.revertedWith("NoReserves(0, 0)")
    })

    it('oracleFactory: update updates oracle state', async () => {
        // create the pair/oracle
        await factory.createPair(tokenA.address, tokenB.address)

        // get the oracle to check it's state before and after update is called
        const prevOracle = await oracleFactory.getOracle(tokenA.address, tokenB.address)

        expect(prevOracle.token0).to.eq(tokenB.address)
        expect(prevOracle.token1).to.eq(tokenA.address)
        // expect all the following to eq 0 since update hasn't been called
        expect(prevOracle.price0CumulativeLast).to.eq(0)
        expect(prevOracle.price1CumulativeLast).to.eq(0)
        expect(prevOracle.blockTimestampLast).to.eq(0)
        expect(prevOracle.price0Average[0]).to.eq(0)
        expect(prevOracle.price1Average[0]).to.eq(0)

        // approve the router to transfer tokens, add liquidity to the pair, and swap
        await prepareForSwap(tokenA, 1000, tokenB, 300)
        await swap(tokenA, tokenB, 40)
        // wait until the block timestamp has advanced
        const waitDuration = 2  // seconds
        await waitUntil(await now() + waitDuration)

        // update the oracle
        await oracleFactory.update(tokenA.address, tokenB.address)

        // get the updated oracle
        const oracle = await oracleFactory.getOracle(tokenA.address, tokenB.address)

        expect(oracle.token0).to.eq(tokenB.address)
        expect(oracle.token1).to.eq(tokenA.address)
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

    it('oracleFactory: update emits Update event', async () => {
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
            .to.emit(oracleFactory, 'Update')
    })

    it('oracleFactory: consult returns amount in if oracle doesn\'t exist', async () => {
        expect(await oracleFactory.consult(tokenB.address, 0, tokenC.address)).to.eq(0)
        expect(await oracleFactory.consult(tokenB.address, 10000, tokenC.address)).to.eq(10000)
        expect(await oracleFactory.consult(tokenB.address, expandTo18Decimals(10000), tokenC.address)).to.eq(expandTo18Decimals(10000))
    })

    it('oracleFactory: consult returns prices if oracle exists', async () => {
        await prepareForSwap(tokenA, 1000, tokenB, 300)
        await swap(tokenA, tokenB, 100)
        expect(await oracleFactory.consult(tokenA.address, 40, tokenB.address)).to.be.at.least(0)
    })

    it('oracleFactory: get oracle for token pair (A, B)', async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        expect((await oracleFactory.getOracle(tokenA.address, tokenB.address)).token0).to.not.eq(constants.ZERO_ADDRESS)
    })

    it('oracleFactory: get oracle argument order doesn\'t matter', async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        expect((await oracleFactory.getOracle(tokenB.address, tokenA.address)).token0).to.not.eq(constants.ZERO_ADDRESS)
    })

    it('oracleFactory: get oracle that hasn\'t been created fails', async () => {
        await expect(oracleFactory.getOracle(tokenA.address, tokenA.address))
            .to.be.revertedWith("OracleDoesNotExist")
    })

    function print(str) {
        if (verbose) console.log(str)
    }

    // prepare the tokens and the pool to swap
    async function prepareForSwap(token0, amount0, token1, amount1) {
        // must approve tokens before they can be added as liquidity
        await token0.approve(router.address, expandTo18Decimals(10000))
        await token1.approve(router.address, expandTo18Decimals(10000))

        // must add liquidity so that there are reserves of each token in pair
        await router.addLiquidity(
            token0.address,
            token1.address,
            expandTo18Decimals(amount0),
            expandTo18Decimals(amount1),
            0,
            0,
            wallet0.address,
            expandTo18Decimals(10000)
        )
    }

    async function swap(token0, token1, amount) {
        // swap the tokens so that oracle.update is called
        await router.swapExactTokensForTokens(
            expandTo18Decimals(amount),
            0,
            [token0.address, token1.address],
            wallet0.address,
            expandTo18Decimals(10000)
        )
    }

    // return the current timestamp
    async function now() {
        return (await provider.getBlock(provider.getBlockNumber())).timestamp
    }

    // perform dummy writes to the contract until the desired timestamp is reached
    async function waitUntil(timestamp) {
        // wait until timestamp is passed
        while (await now() <= timestamp) {
            await oracleFactory.setPeriod(86000)
        }
    }
})
