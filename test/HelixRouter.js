const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { bigNumberify } = require("legacy-ethers/utils")
const { expandTo18Decimals, createAndGetPair, getApprovalDigest, getDomainSeparator } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")
const { ecsign } = require("ethereumjs-util")

const { constants } = require("@openzeppelin/test-helpers")

const verbose = true

const MINIMUM_LIQUIDITY = bigNumberify(10).pow(3)

describe('HelixRouter', () => {
    let wallet

    let token0
    let token1
    let router
    let pair
    let swapFee
    let factory

    beforeEach(async function() {
        [wallet] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        factory = fullExchange.factory
        router = fullExchange.router
        const tokenA = fullExchange.tokenA
        const tokenB = fullExchange.tokenB

        const result = await createAndGetPair(factory, tokenA, tokenB)
        factory = result.factory
        token0 = result.token0
        token1 = result.token1
        pair = result.pair

        swapFee = await pair.swapFee()
    })

    it('router: prints factory init code hash', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`)
    })

    it('router: quote', async () => {
        expect(await router.quote(bigNumberify(1), bigNumberify(100), bigNumberify(200)))
            .to.eq(bigNumberify(2))
        expect(await router.quote(bigNumberify(2), bigNumberify(200), bigNumberify(100)))
            .to.eq(bigNumberify(1))
        await expect(router.quote(bigNumberify(0), bigNumberify(100), bigNumberify(200)))
            .to.be.revertedWith( 'HelixLibrary: zero amount')
        await expect(router.quote(bigNumberify(1), bigNumberify(0), bigNumberify(200)))
            .to.be.revertedWith( 'HelixLibrary: zero liquidity')
        await expect(router.quote(bigNumberify(1), bigNumberify(100), bigNumberify(0)))
            .to.be.revertedWith( 'HelixLibrary: zero liquidity')
    })

    it('router: getAmountOut', async () => {
        const func = router['getAmountOut(uint256,uint256,uint256,uint256)'];
        expect(await func(bigNumberify(2), bigNumberify(100), bigNumberify(100), swapFee))
            .to.eq(bigNumberify(1))
        await expect(func(bigNumberify(0), bigNumberify(100), bigNumberify(100), swapFee))
            .to.be.revertedWith('HelixLibrary: zero amount')
        await expect(func(bigNumberify(2), bigNumberify(0), bigNumberify(100), swapFee))
            .to.be.revertedWith('HelixLibrary: zero liquidity')
        await expect(func(bigNumberify(2), bigNumberify(100), bigNumberify(0), swapFee))
            .to.be.revertedWith('HelixLibrary: zero liquidity')
    })

    it('router: getAmountIn', async () => {
        const func = router['getAmountIn(uint256,uint256,uint256,uint256)'];
        expect(await func(bigNumberify(1), bigNumberify(100), bigNumberify(100), swapFee))
            .to.eq(bigNumberify(2))
        await expect(func(bigNumberify(0), bigNumberify(100), bigNumberify(100), swapFee))
            .to.be.revertedWith('HelixLibrary: zero amount')
        await expect(func(bigNumberify(1), bigNumberify(0), bigNumberify(100), swapFee))
            .to.be.revertedWith('HelixLibrary: zero liquidity')
        await expect(func(bigNumberify(1), bigNumberify(100), bigNumberify(0), swapFee))
            .to.be.revertedWith('HelixLibrary: zero liquidity')
    })

    it('router: getAmountsOut', async () => {
        await token0.approve(router.address, expandTo18Decimals(10000))
        await token1.approve(router.address, expandTo18Decimals(10000))
        const x = await router.addLiquidity(
            token0.address,
            token1.address,
            bigNumberify(2000),
            bigNumberify(2000),
            0,
            0,
            wallet.address,
            expandTo18Decimals(100000),
        )

        const func = router['getAmountsOut'];
        await expect(func(bigNumberify(2), [token0.address]))
            .to.be.revertedWith('HelixLibrary: invalid path')

        const path = [token0.address, token1.address]
        const result = await func(bigNumberify(2), path)
        expect(result[0]).to.eq(bigNumberify(2))
        expect(result[1]).to.eq(bigNumberify(1))
    })

    it('router: getAmountsIn', async () => {
        await token0.approve(router.address, expandTo18Decimals(100000))
        await token1.approve(router.address, expandTo18Decimals(100000))
        await router.addLiquidity(
            token0.address,
            token1.address,
            bigNumberify(10000),
            bigNumberify(10000),
            0,
            0,
            wallet.address,
            expandTo18Decimals(100000)
        )

        const func = router['getAmountsIn'];
        await expect(func(bigNumberify(1), [token0.address]))
            .to.be.revertedWith('HelixLibrary: invalid path')

        const path = [token0.address, token1.address]
        const result = await func(bigNumberify(2), path)
        expect(result[0]).to.eq(bigNumberify(3))
        expect(result[1]).to.eq(bigNumberify(2))
    })
})

describe('fee-on-transfer tokens', () => {
    let wallet

    let DTT
    let WETH
    let router
    let pair

    beforeEach(async function() {
        [wallet] = await ethers.getSigners()
        const fixture = await loadFixture(fullExchangeFixture)

        WETH = fixture.weth
        router = fixture.router
    
        dERC20ContractFactory = await ethers.getContractFactory("DeflatingERC20")
        DTT = await dERC20ContractFactory.deploy(expandTo18Decimals(10000))

        // make a DTT<>WETH pair
        await fixture.factory.createPair(DTT.address, WETH.address)
        const pairAddress = await fixture.factory.getPair(DTT.address, WETH.address)
        const pairContractFactory = await ethers.getContractFactory("HelixPair")
        pair = pairContractFactory.attach(pairAddress).connect(wallet)
    })

    async function addLiquidity(DTTAmount, WETHAmount) {
        await DTT.approve(router.address, expandTo18Decimals(100000))
        await router.addLiquidityETH(
            DTT.address,
            DTTAmount,
            DTTAmount,
            WETHAmount,
            wallet.address,
            expandTo18Decimals(100000),
            {
                value: WETHAmount
            }
        )
    }

    it('router: removeLiquidityETHSupportingFeeOnTransferTokens', async () => {
        const DTTAmount = expandTo18Decimals(1)
        const ETHAmount = expandTo18Decimals(4)
        await addLiquidity(DTTAmount, ETHAmount)

        const DTTInPair = await DTT.balanceOf(pair.address)
        const WETHInPair = await WETH.balanceOf(pair.address)
        const liquidity = await pair.balanceOf(wallet.address)
        const totalSupply = await pair.totalSupply()
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply)
        const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply)

        await pair.approve(router.address, expandTo18Decimals(100000))
        await router.removeLiquidityETHSupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WETHExpected,
            wallet.address,
            expandTo18Decimals(100000)
        )
    })

    /* TODO get a wallet with a private key, fails on 219
    it('router: removeLiquidityETHWithPermitSupportingFeeOnTransferTokens', async () => {
        const DTTAmount = expandTo18Decimals(1).mul(100).div(99)
        const ETHAmount = expandTo18Decimals(4)
        await addLiquidity(DTTAmount, ETHAmount)

        const expectedLiquidity = expandTo18Decimals(2)

        const nonce = await pair.nonces(wallet.address)
        const digest = await getApprovalDigest(
            pair,
            {
                owner: wallet.address,
                spender: router.address,
                value: expectedLiquidity.sub(MINIMUM_LIQUIDITY)
            },
            nonce,
            expandTo18Decimals(100000)
        )
        const { v, r, s } = ecsign(
            Buffer.from(digest.slice(2), 'hex'),
            Buffer.from(wallet.privateKey.slice(2), 'hex')
        )

        const DTTInPair = await DTT.balanceOf(pair.address)
        const WETHInPair = await WETH.balanceOf(pair.address)
        const liquidity = await pair.balanceOf(wallet.address)
        const totalSupply = await pair.totalSupply()
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply)
        const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply)

        await pair.approve(router.address, expandTo18Decimals(100000))
        await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WETHExpected,
            wallet.address,
            expandTo18Decimals(100000),
            false,
            v,
            r,
            s
        )
    })
    */

    describe('swapExactTokensForTokensSupportingFeeOnTransferTokens', () => {
        const DTTAmount = expandTo18Decimals(5).mul(100).div(99)
        const ETHAmount = expandTo18Decimals(10)
        const amountIn = expandTo18Decimals(1)

        beforeEach(async () => {
            await addLiquidity(DTTAmount, ETHAmount)
        })

        it('router: DTT -> WETH', async () => {
            await DTT.approve(router.address, expandTo18Decimals(100000))

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [DTT.address, WETH.address],
                wallet.address,
                expandTo18Decimals(100000)
            )
        })

        // WETH -> DTT
        it('router: WETH -> DTT', async () => {
            await WETH.deposit({ value: amountIn }) // mint WETH
            await WETH.approve(router.address, expandTo18Decimals(100000))

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [WETH.address, DTT.address],
                wallet.address,
                expandTo18Decimals(100000)
            )
        })
    })

    // ETH -> DTT
    it('router: swapExactETHForTokensSupportingFeeOnTransferTokens', async () => {
        const DTTAmount = expandTo18Decimals(10).mul(100).div(99)
        const ETHAmount = expandTo18Decimals(5)
        const swapAmount = expandTo18Decimals(1)
        await addLiquidity(DTTAmount, ETHAmount)

        await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [WETH.address, DTT.address],
            wallet.address,
            expandTo18Decimals(100000),
            {
                value: swapAmount
            }
        )
    })

    // DTT -> ETH
    it('router: swapExactTokensForETHSupportingFeeOnTransferTokens', async () => {
        const DTTAmount = expandTo18Decimals(5).mul(100).div(99)
        const ETHAmount = expandTo18Decimals(10)
        const swapAmount = expandTo18Decimals(1)

        await addLiquidity(DTTAmount, ETHAmount)
        await DTT.approve(router.address, expandTo18Decimals(100000))

        await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            swapAmount,
            0,
            [DTT.address, WETH.address],
            wallet.address,
            expandTo18Decimals(100000)
        )
    })
})

describe('fee-on-transfer tokens: reloaded', () => {
    let wallet

    let DTT
    let DTT2
    let router

    beforeEach(async function() {
        [wallet] = await ethers.getSigners()
        const fixture = await loadFixture(fullExchangeFixture)

        router = fixture.router

        dERC20ContractFactory = await ethers.getContractFactory("DeflatingERC20")
        DTT = await dERC20ContractFactory.deploy(expandTo18Decimals(10000))
        DTT2 = await dERC20ContractFactory.deploy(expandTo18Decimals(10000))

        // make a DTT<>WETH pair
        await fixture.factory.createPair(DTT.address, DTT2.address)
        const pairAddress = await fixture.factory.getPair(DTT.address, DTT2.address)
    })

    async function addLiquidity(DTTAmount, DTT2Amount) {
        await DTT.approve(router.address, expandTo18Decimals(100000))
        await DTT2.approve(router.address, expandTo18Decimals(100000))
        await router.addLiquidity(
            DTT.address,
            DTT2.address,
            DTTAmount,
            DTT2Amount,
            DTTAmount,
            DTT2Amount,
            wallet.address,
            expandTo18Decimals(100000)
        )
    }

    describe('swapExactTokensForTokensSupportingFeeOnTransferTokens', () => {
        const DTTAmount = expandTo18Decimals(5).mul(100).div(99)
        const DTT2Amount = expandTo18Decimals(5)
        const amountIn = expandTo18Decimals(1)

        beforeEach(async () => {
            await addLiquidity(DTTAmount, DTT2Amount)
        })

        it('router: DTT -> DTT2', async () => {
            await DTT.approve(router.address, expandTo18Decimals(100000))

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [DTT.address, DTT2.address],
                wallet.address,
                expandTo18Decimals(100000)
            )
        })
    })
})
