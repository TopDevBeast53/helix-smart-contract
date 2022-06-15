const { expect } = require("chai")                                                                   
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                
const { expandTo18Decimals, encodePrice } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true   

const MINIMUM_LIQUIDITY = bigNumberify(10).pow(3)

function getAmountOut(amountIn, reserveIn, reserveOut)  {
    let amountInWithFee = amountIn.mul(998)
    let numerator = amountInWithFee.mul(reserveOut)
    let denominator = reserveIn.mul(1000).add(amountInWithFee)
    return numerator.div(denominator)
}

function getAmountIn(amountOut, reserveIn, reserveOut)  {
    let numerator = reserveIn.mul(amountOut).mul(1000)
    let denominator = reserveOut.sub(amountOut).mul(998)
    return numerator.div(denominator).add(1)
}

describe('HelixPair', () => {
    let wallet, other

    let factory
    let token0
    let token1
    let pair

    beforeEach(async () => {
        [wallet, other] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        factory = fullExchange.factory
        const tokenA = fullExchange.tokenA
        const tokenB = fullExchange.tokenB

        // Locally create the pair
        await factory.createPair(tokenA.address, tokenB.address)
        const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        const pairContractFactory = await ethers.getContractFactory("HelixPair")                     
        pair = pairContractFactory.attach(pairAddress).connect(wallet) 
    
        const token0Address = (await pair.token0()).address
        token0 = tokenA.address === token0Address ? tokenB : tokenA
        token1 = tokenA.address === token0Address ? tokenA : tokenB
    })

    it('helixPair: prints factory init code hash', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`)
    })

    it('helixPair: mint', async () => {
        const token0Amount = expandTo18Decimals(1)
        const token1Amount = expandTo18Decimals(4)
        await token0.transfer(pair.address, token0Amount)
        await token1.transfer(pair.address, token1Amount)

        const expectedLiquidity = expandTo18Decimals(2)
        await expect(pair.mint(wallet.address))
            .to.emit(pair, 'Transfer')
            .withArgs(constants.ZERO_ADDRESS, constants.ZERO_ADDRESS, MINIMUM_LIQUIDITY)
            .to.emit(pair, 'Transfer')
            .withArgs(constants.ZERO_ADDRESS, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(pair, 'Update')
            .withArgs(token0Amount, token1Amount)
            .to.emit(pair, 'Mint')
            .withArgs(wallet.address, wallet.address, token0Amount, token1Amount)

        expect(await pair.totalSupply()).to.eq(expectedLiquidity)
        expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        expect(await token0.balanceOf(pair.address)).to.eq(token0Amount)
        expect(await token1.balanceOf(pair.address)).to.eq(token1Amount)
        const reserves = await pair.getReserves()
        expect(reserves[0]).to.eq(token0Amount)
        expect(reserves[1]).to.eq(token1Amount)
    })

    async function addLiquidity(token0Amount, token1Amount) {
        await token0.transfer(pair.address, token0Amount)
        await token1.transfer(pair.address, token1Amount)
        await pair.mint(wallet.address)
    }

    /* TODO Fix these to account for changing swapFee from 2 to 1
    const swapTestCases = [
        [1, 5, 10, '1663887962654218072'],
        [1, 10, 5, '453718857974177123'],

        [2, 5, 10, '2853058890794739851'],
        [2, 10, 5, '831943981327109036'],

        [1, 10, 10, '907437715948354246'],
        [1, 100, 100, '988138378977801540'],
        [1, 1000, 1000, '997004989020957084']
    ].map(a => a.map(n => (typeof n === 'string' ? bigNumberify(n) : expandTo18Decimals(n))))

    swapTestCases.forEach((swapTestCase, i) => {
        it(`helixPair: getInputPrice ${i}`, async () => {
            const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase
            await addLiquidity(token0Amount, token1Amount)
            await token0.transfer(pair.address, swapAmount)
            await expect(pair.swap(0, expectedOutputAmount.add(1), wallet.address))
                .to.be.revertedWith("InsufficientReserves")
            await pair.swap(0, expectedOutputAmount, wallet.address)
        })
    })

    const optimisticTestCases = [
        ['998000000000000000', 5, 10, 1],
        ['998000000000000000', 10, 5, 1],
        ['998000000000000000', 5, 5, 1],
        [1, 5, 5, '1002004008016032065']
    ].map(a => a.map(n => (typeof n === 'string' ? bigNumberify(n) : expandTo18Decimals(n))))

    optimisticTestCases.forEach((optimisticTestCase, i) => {
        it(`helixPair: optimistic ${i}`, async () => {
            const [outputAmount, token0Amount, token1Amount, inputAmount] = optimisticTestCase
            await addLiquidity(token0Amount, token1Amount)
            await token0.transfer(pair.address, inputAmount)
            await expect(pair.swap(outputAmount.add(1), 0, wallet.address))
                .to.be.revertedWith("InsufficientReserves")
            await pair.swap(outputAmount, 0, wallet.address)
        })
    })
    */

    it('helixPair: swap token0', async () => {
        const token0Amount = expandTo18Decimals(5)
        const token1Amount = expandTo18Decimals(10)
        await addLiquidity(token0Amount, token1Amount)

        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = bigNumberify('1662497915624478906')
        await token0.transfer(pair.address, swapAmount)
        await expect(pair.swap(0, expectedOutputAmount, wallet.address))
            .to.emit(token1, 'Transfer')
            .withArgs(pair.address, wallet.address, expectedOutputAmount)
            .to.emit(pair, 'Update')
            .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
            .to.emit(pair, 'Swap')
            .withArgs(wallet.address, wallet.address, swapAmount, 0, 0, expectedOutputAmount)

        const reserves = await pair.getReserves()
        expect(reserves[0]).to.eq(token0Amount.add(swapAmount))
        expect(reserves[1]).to.eq(token1Amount.sub(expectedOutputAmount))
        expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.add(swapAmount))
        expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.sub(expectedOutputAmount))
        const totalSupplyToken0 = await token0.totalSupply()
        const totalSupplyToken1 = await token1.totalSupply()
        expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(token0Amount).sub(swapAmount))
        expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(token1Amount).add(expectedOutputAmount))
    })

    it('helixPair: swap token1', async () => {
        const token0Amount = expandTo18Decimals(5)
        const token1Amount = expandTo18Decimals(10)
        await addLiquidity(token0Amount, token1Amount)

        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = bigNumberify('453305446940074565')
        await token1.transfer(pair.address, swapAmount)
        await expect(pair.swap(expectedOutputAmount, 0, wallet.address))
            .to.emit(token0, 'Transfer')
            .withArgs(pair.address, wallet.address, expectedOutputAmount)
            .to.emit(pair, 'Update')
            .withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
            .to.emit(pair, 'Swap')
            .withArgs(wallet.address, wallet.address, 0, swapAmount, expectedOutputAmount, 0)

        const reserves = await pair.getReserves()
        expect(reserves[0]).to.eq(token0Amount.sub(expectedOutputAmount))
        expect(reserves[1]).to.eq(token1Amount.add(swapAmount))
        expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.sub(expectedOutputAmount))
        expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.add(swapAmount))
        const totalSupplyToken0 = await token0.totalSupply()
        const totalSupplyToken1 = await token1.totalSupply()
        expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(token0Amount).add(expectedOutputAmount))
        expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(token1Amount).sub(swapAmount))
    })

    it('helixPair: swap gas', async () => {
        const token0Amount = expandTo18Decimals(5)
        const token1Amount = expandTo18Decimals(10)
        await addLiquidity(token0Amount, token1Amount)

        // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
        await mineBlocks(1)
        await pair.sync()

        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = bigNumberify('453305446940074565')
        await token1.transfer(pair.address, swapAmount)
        await mineBlocks(1)
        const tx = await pair.swap(expectedOutputAmount, 0, wallet.addresss)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(205225)
    })

    it('helixPair: burn', async () => {
        const token0Amount = expandTo18Decimals(3)
        const token1Amount = expandTo18Decimals(3)
        await addLiquidity(token0Amount, token1Amount)

        const expectedLiquidity = expandTo18Decimals(3)
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        await expect(pair.burn(wallet.address))
            .to.emit(pair, 'Transfer')
            .withArgs(pair.address, constants.ZERO_ADDRESS, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(token0, 'Transfer')
            .withArgs(pair.address, wallet.address, token0Amount.sub(1000))
            .to.emit(token1, 'Transfer')
            .withArgs(pair.address, wallet.address, token1Amount.sub(1000))
            .to.emit(pair, 'Update')
            .withArgs(1000, 1000)
            .to.emit(pair, 'Burn')
            .withArgs(wallet.address, wallet.address, token0Amount.sub(1000), token1Amount.sub(1000))

        expect(await pair.balanceOf(wallet.address)).to.eq(0)
        expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY)
        expect(await token0.balanceOf(pair.address)).to.eq(1000)
        expect(await token1.balanceOf(pair.address)).to.eq(1000)
        const totalSupplyToken0 = await token0.totalSupply()
        const totalSupplyToken1 = await token1.totalSupply()
        expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(1000))
        expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(1000))
    })

    it('helixPair: price{0,1}CumulativeLast', async () => {
        const token0Amount = expandTo18Decimals(3)
        const token1Amount = expandTo18Decimals(3)
        await addLiquidity(token0Amount, token1Amount)

        const blockTimestamp = (await pair.getReserves())[2]
        await mineBlocks(1)
        await pair.sync()

        const initialPrice = encodePrice(token0Amount, token1Amount)
        expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0])
        expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1])
        expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 1)

        const swapAmount = expandTo18Decimals(3)
        await token0.transfer(pair.address, swapAmount)
        await mineBlocks(10)
        // swap to a new price eagerly instead of syncing
        await pair.swap(0, expandTo18Decimals(1), wallet.address) // make the price nice

        expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0].mul(10))
        expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1].mul(10))
        expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 10)

        await mineBlocks(20)
        await pair.sync()

        const newPrice = encodePrice(expandTo18Decimals(6), expandTo18Decimals(2))
        expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0].mul(10).add(newPrice[0].mul(10)))
        expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1].mul(10).add(newPrice[1].mul(10)))
        expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 20)
    })

    it('helixPair: feeTo:off', async () => {
        const token0Amount = expandTo18Decimals(1000)
        const token1Amount = expandTo18Decimals(1000)
        await addLiquidity(token0Amount, token1Amount)

        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = bigNumberify('996006981039903216')
        await token1.transfer(pair.address, swapAmount)
        await pair.swap(expectedOutputAmount, 0, wallet.address)

        const expectedLiquidity = expandTo18Decimals(1000)
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        await pair.burn(wallet.address)
        expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY)
    })

    it('helixPair: feeTo:on', async () => {
        await factory.setFeeTo(other.address)

        const token0Amount = expandTo18Decimals(1000)
        const token1Amount = expandTo18Decimals(1000)
        await addLiquidity(token0Amount, token1Amount)

        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = bigNumberify('996006981039903216')
        await token1.transfer(pair.address, swapAmount)
        await pair.swap(expectedOutputAmount, 0, wallet.address)

        const expectedLiquidity = expandTo18Decimals(1000)
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        await pair.burn(wallet.address)
        expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY.add('1498504866770022'))
        expect(await pair.balanceOf(other.address)).to.eq('1498504866770022')

        // using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
        // ...because the initial liquidity amounts were equal
        expect(await token0.balanceOf(pair.address)).to.eq(bigNumberify(1000).add('1497010102184673'))
        expect(await token1.balanceOf(pair.address)).to.eq(bigNumberify(1000).add('1500001123877809'))
    })

    async function mineBlocks(n) {
        for (let i = 0; i < n; i++) {
            await ethers.provider.send('evm_mine')
        }
    }
})
