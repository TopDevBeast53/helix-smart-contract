import chai, { expect } from 'chai'
import { Contract } from 'legacy-ethers'
import { solidity, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'

import { expandTo18Decimals, mineBlock, encodePrice, createAndGetPair } from './shared/utilities'
import { fullExchangeFixture } from './shared/fixtures'
import { AddressZero } from 'legacy-ethers/constants'

import HelixPair from '../build/contracts/HelixPair.json'

const MINIMUM_LIQUIDITY = bigNumberify(10).pow(3)

chai.use(solidity)

const overrides = {
    gasLimit: 9999999
}

function getAmountOut(amountIn: BigNumber, reserveIn: BigNumber, reserveOut: BigNumber)  {
    let amountInWithFee = amountIn.mul(998);
    let numerator = amountInWithFee.mul(reserveOut);
    let denominator = reserveIn.mul(1000).add(amountInWithFee);
    return numerator.div(denominator);
}

function getAmountIn(amountOut: BigNumber, reserveIn: BigNumber, reserveOut: BigNumber)  {
    let numerator = reserveIn.mul(amountOut).mul(1000);
    let denominator = reserveOut.sub(amountOut).mul(998);
    return numerator.div(denominator).add(1);
}

describe('HelixPair', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 9999999
    })
    const [wallet, other] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet])

    let factory: Contract
    let token0: Contract
    let token1: Contract
    let pair: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        factory = fullExchange.factory
        const tokenA = fullExchange.tokenA
        const tokenB = fullExchange.tokenB

        // Locally create the pair
        await factory.createPair(tokenA.address, tokenB.address, overrides)
        const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        pair = new Contract(pairAddress, JSON.stringify(HelixPair.abi), provider).connect(wallet)

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
        await expect(pair.mint(wallet.address, overrides))
            .to.emit(pair, 'Transfer')
            .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
            .to.emit(pair, 'Transfer')
            .withArgs(AddressZero, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(pair, 'Sync')
            .withArgs(token0Amount, token1Amount)
            .to.emit(pair, 'Mint')
            .withArgs(wallet.address, token0Amount, token1Amount)

        expect(await pair.totalSupply()).to.eq(expectedLiquidity)
        expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        expect(await token0.balanceOf(pair.address)).to.eq(token0Amount)
        expect(await token1.balanceOf(pair.address)).to.eq(token1Amount)
        const reserves = await pair.getReserves()
        expect(reserves[0]).to.eq(token0Amount)
        expect(reserves[1]).to.eq(token1Amount)
    })

    async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber) {
        await token0.transfer(pair.address, token0Amount)
        await token1.transfer(pair.address, token1Amount)
        await pair.mint(wallet.address, overrides)
    }

    const swapTestCases: BigNumber[][] = [
        [1, 5, 10, '1663887962654218072'],
        [1, 10, 5, '453718857974177123'],

        [2, 5, 10, '2853058890794739851'],
        [2, 10, 5, '831943981327109036'],

        [1, 10, 10, '907437715948354246'],
        [1, 100, 100, '988138378977801540'],
        [1, 1000, 1000, '997004989020957084']
    ].map(a => a.map(n => (typeof n === 'string' ? bigNumberify(n) : expandTo18Decimals(n))))

    swapTestCases.forEach((swapTestCase, i) => {
        it(`getInputPrice:${i}`, async () => {
            const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase
            await addLiquidity(token0Amount, token1Amount)
            await token0.transfer(pair.address, swapAmount)
            await expect(pair.swap(0, expectedOutputAmount.add(1), wallet.address, '0x', overrides))
                .to.be.revertedWith('Helix K')
            await pair.swap(0, expectedOutputAmount, wallet.address, '0x', overrides)
        })
    })

    const optimisticTestCases: BigNumber[][] = [
        ['998000000000000000', 5, 10, 1],
        ['998000000000000000', 10, 5, 1],
        ['998000000000000000', 5, 5, 1],
        [1, 5, 5, '1002004008016032065']
    ].map(a => a.map(n => (typeof n === 'string' ? bigNumberify(n) : expandTo18Decimals(n))))

    optimisticTestCases.forEach((optimisticTestCase, i) => {
        it(`optimistic:${i}`, async () => {
            const [outputAmount, token0Amount, token1Amount, inputAmount] = optimisticTestCase
            await addLiquidity(token0Amount, token1Amount)
            await token0.transfer(pair.address, inputAmount)
            await expect(pair.swap(outputAmount.add(1), 0, wallet.address, '0x', overrides))
                .to.be.revertedWith('Helix K')
            await pair.swap(outputAmount, 0, wallet.address, '0x', overrides)
        })
    })

    it('helixPair: swap token0', async () => {
        const token0Amount = expandTo18Decimals(5)
        const token1Amount = expandTo18Decimals(10)
        await addLiquidity(token0Amount, token1Amount)

        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = bigNumberify('1662497915624478906')
        await token0.transfer(pair.address, swapAmount)
        await expect(pair.swap(0, expectedOutputAmount, wallet.address, '0x', overrides))
            .to.emit(token1, 'Transfer')
            .withArgs(pair.address, wallet.address, expectedOutputAmount)
            .to.emit(pair, 'Sync')
            .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
            .to.emit(pair, 'Swap')
            .withArgs(wallet.address, swapAmount, 0, 0, expectedOutputAmount, wallet.address)

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
        await expect(pair.swap(expectedOutputAmount, 0, wallet.address, '0x', overrides))
            .to.emit(token0, 'Transfer')
            .withArgs(pair.address, wallet.address, expectedOutputAmount)
            .to.emit(pair, 'Sync')
            .withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
            .to.emit(pair, 'Swap')
            .withArgs(wallet.address, 0, swapAmount, expectedOutputAmount, 0, wallet.address)

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
        await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
        await pair.sync(overrides)

        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = bigNumberify('453305446940074565')
        await token1.transfer(pair.address, swapAmount)
        await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
        const tx = await pair.swap(expectedOutputAmount, 0, wallet.address, '0x', overrides)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(206074)
    })

    it('helixPair: burn', async () => {
        const token0Amount = expandTo18Decimals(3)
        const token1Amount = expandTo18Decimals(3)
        await addLiquidity(token0Amount, token1Amount)

        const expectedLiquidity = expandTo18Decimals(3)
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        await expect(pair.burn(wallet.address, overrides))
            .to.emit(pair, 'Transfer')
            .withArgs(pair.address, AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(token0, 'Transfer')
            .withArgs(pair.address, wallet.address, token0Amount.sub(1000))
            .to.emit(token1, 'Transfer')
            .withArgs(pair.address, wallet.address, token1Amount.sub(1000))
            .to.emit(pair, 'Sync')
            .withArgs(1000, 1000)
            .to.emit(pair, 'Burn')
            .withArgs(wallet.address, token0Amount.sub(1000), token1Amount.sub(1000), wallet.address)

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
        await mineBlock(provider, blockTimestamp + 1)
        await pair.sync(overrides)

        const initialPrice = encodePrice(token0Amount, token1Amount)
        expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0])
        expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1])
        expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 1)

        const swapAmount = expandTo18Decimals(3)
        await token0.transfer(pair.address, swapAmount)
        await mineBlock(provider, blockTimestamp + 10)
        // swap to a new price eagerly instead of syncing
        await pair.swap(0, expandTo18Decimals(1), wallet.address, '0x', overrides) // make the price nice

        expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0].mul(10))
        expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1].mul(10))
        expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 10)

        await mineBlock(provider, blockTimestamp + 20)
        await pair.sync(overrides)

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
        await pair.swap(expectedOutputAmount, 0, wallet.address, '0x', overrides)

        const expectedLiquidity = expandTo18Decimals(1000)
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        await pair.burn(wallet.address, overrides)
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
        await pair.swap(expectedOutputAmount, 0, wallet.address, '0x', overrides)

        const expectedLiquidity = expandTo18Decimals(1000)
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        await pair.burn(wallet.address, overrides)
        expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY.add('249750499251388'))
        expect(await pair.balanceOf(other.address)).to.eq('249750499251388')

        // using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
        // ...because the initial liquidity amounts were equal
        expect(await token0.balanceOf(pair.address)).to.eq(bigNumberify(1000).add('249501683697445'))
        expect(await token1.balanceOf(pair.address)).to.eq(bigNumberify(1000).add('250000187312969'))
    })
})
