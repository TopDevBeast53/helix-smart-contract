const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")

const deadline = expandTo18Decimals(10000)
                                                                                                   
describe("RouterProxy", () => {
    let alice, bobby, carol, david, edith
    let routerProxy
    let router
    let tokenA
    let tokenB
    let weth

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)

        routerProxy = fixture.routerProxy
        router = fixture.router
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
        weth = fixture.weth
    })

    it("routerProxy: initialized correctly", async () => {
        expect(await routerProxy.owner()).to.eq(alice.address)
        expect(await routerProxy.router()).to.eq(router.address)
        expect(await routerProxy.partner()).to.eq(bobby.address)
        expect(await routerProxy.percentDecimals()).to.eq(100000)
    })

    async function addLiquidity(amountA, amountB, from, to) {
        await tokenA.connect(from).approve(router.address, amountA)
        await tokenB.connect(from).approve(router.address, amountB)
        await router.connect(from).addLiquidity(
            tokenA.address,
            tokenB.address,
            amountA,
            amountB,
            0,
            0,
            to.address,
            deadline
        )
    }

    async function addLiquidityEth(liquidityA, liquidityEth, from, to) {
        await tokenA.connect(from).approve(router.address, liquidityA)
        await router.connect(from).addLiquidityETH(
            tokenA.address,
            liquidityA,
            0,
            0,
            to.address,
            deadline,
            { value: liquidityEth }
        )
    }

    async function getBalancesWallet(from) {
        return {
            eth: await from.getBalance(),
            tokenA: await tokenA.balanceOf(from.address),
            tokenB: await tokenB.balanceOf(from.address),
        }
    }

    async function getBalancesContract(from) {
        return {
            tokenA: await tokenA.balanceOf(from.address),
            tokenB: await tokenB.balanceOf(from.address),
        }
    }

    async function getBalances() {
        return {
            alice: await getBalancesWallet(alice),
            bobby: await getBalancesWallet(bobby),
            carol: await getBalancesWallet(carol),
            router: await getBalancesContract(router),
            routerProxy: await getBalancesContract(routerProxy),
        }
    }

    async function getGas(tx) {
        const receipt = await tx.wait()
        return receipt.gasUsed.mul(receipt.effectiveGasPrice)
    }

    function getFee(amountIn, partnerPercent) {
        // will fail if amountIn is not a BigNumber
        return amountIn.mul(partnerPercent).div(100000)
    }

    it("routerProxy: set and get partner percent", async () => {
        const partnerPercents = [0, 5, 50, 500, 5000, 50000, 100000]
        const amountsIn = [0, 1, 10, 100, 1000, 10000, 100000]

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let j = 0; j < amountsIn.length; j++) {
                const amountIn = expandTo18Decimals(amountsIn[j])
                expect(await routerProxy.getFee(amountIn)).to.eq(getFee(amountIn, partnerPercent))
            }
        }

        await expect(routerProxy.connect(bobby).setPartnerPercent(100001))
            .to.be.revertedWith("Invalid partner percent")
    })

    async function swapExactTokensForTokens(amountIn) {
        // alice adds liquidity
        const liquidityA = expandTo18Decimals(1000)
        const liquidityB = expandTo18Decimals(1000)
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        // alice transfers tokens to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount)

        // set the tokens to swap
        const path = [tokenA.address, tokenB.address]

        // set the amountIn and get the fee and amountOut
        amountIn = expandTo18Decimals(amountIn)
        const fee = await routerProxy.getFee(amountIn)
        const amountsOut = await router.getAmountsOut(amountIn.sub(fee), path)
        const amountOut = amountsOut[amountsOut.length - 1]

        // carol approve the transfer
        await tokenA.connect(carol).approve(routerProxy.address, amountIn)

        // collect data before swap
        const prevBalances = await getBalances()

        // carol swaps
        const tx = await routerProxy.connect(carol).swapExactTokensForTokens(
            amountIn,
            0,
            path,
            carol.address,
            deadline,
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(amountIn))
        expect(postBalances.carol.tokenB).to.eq(prevBalances.carol.tokenB.add(amountOut))

    }

    function randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min) + min)
    }

    it("routerProxy: swap exact tokens for tokens", async () => {
        amountIn = randomNumber(0, 500)
        await swapExactTokensForTokens(amountIn)
    })

    async function swapTokensForExactTokens(amountOut) {
        // alice adds liquidity
        const liquidityA = expandTo18Decimals(1000)
        const liquidityB = expandTo18Decimals(1000)
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        // alice transfers tokens to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount)

        // set the tokens to swap
        const path = [tokenA.address, tokenB.address]

        // set the amountOut and get the fee and amountIn
        amountOut = expandTo18Decimals(amountOut)
        const amountsIn = await router.getAmountsIn(amountOut, path)
        const amountIn = amountsIn[0]
        const fee = await routerProxy.getFee(amountIn)

        // carol approve the transfer
        await tokenA.connect(carol).approve(routerProxy.address, amountIn.add(fee))

        // collect data before swap
        const prevBalances = await getBalances()

        // carol swap on routerProxy
        const tx = await routerProxy.connect(carol).swapTokensForExactTokens(
            amountOut,
            amountIn.add(fee),
            path,
            carol.address,
            deadline 
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(amountIn.add(fee)))
        expect(postBalances.carol.tokenB).to.eq(prevBalances.carol.tokenB.add(amountOut))
    }

    it("routerProxy: swap tokens for exact tokens", async () => {
        amountOut = randomNumber(0, 500)
        await swapTokensForExactTokens(amountOut)
    })

    async function swapExactETHForTokens(amountIn) {
        // alice add pair (weth, B) to router
        const liquidityA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // set the tokens to swap
        const path = [weth.address, tokenA.address]

        // set the amountIn and get the fee and amountOut
        amountIn = expandTo18Decimals(amountIn)
        const fee = await routerProxy.getFee(amountIn)
        const amountsOut = await router.getAmountsOut(amountIn.sub(fee), path)
        const amountOut = amountsOut[amountsOut.length - 1]

        // collect data before swap
        const prevBalances = await getBalances()

        const tx = await routerProxy.connect(carol).swapExactETHForTokens(
            0,
            path,
            carol.address,
            deadline,
            { value: amountIn }
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.eth).to.eq(prevBalances.bobby.eth.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas).sub(amountIn))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.add(amountOut))
    }

    it("routerProxy: swap exact ETH for tokens", async () => {
        amountIn = randomNumber(0, 500)
        await swapExactETHForTokens(amountIn)
    })

    async function swapTokensForExactETH(amountOut) {
        const liquidityA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // alice transfer tokenA to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

        // set the tokens to swap
        const path = [tokenA.address, weth.address]

        // set the amountOut and get the amountIn and fee
        amountOut = expandTo18Decimals(amountOut)
        const amountsIn = await router.getAmountsIn(amountOut, path)
        const amountIn = amountsIn[0]
        const fee = await routerProxy.getFee(amountIn)

        // carol approve the transfer
        await tokenA.connect(carol).approve(routerProxy.address, amountIn.add(fee))

        // collect data before swap
        const prevBalances = await getBalances()

        const tx = await routerProxy.connect(carol).swapTokensForExactETH(
            amountOut,
            amountIn.add(fee),
            path,
            carol.address,
            deadline,
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas).add(amountOut))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(amountIn).sub(fee))
    }

    it("routerProxy: swap tokens for exact ETH", async () => {
        amountOut = randomNumber(0, 500)
        await swapTokensForExactETH(amountOut)
    })

    async function swapExactTokensForETH(amountIn) {
        const liquidityA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // alice transfer tokenA to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

        // set the tokens to swap
        const path = [tokenA.address, weth.address]

        // set the amountIn and get the fee and amountOut 
        amountIn = expandTo18Decimals(amountIn)
        const fee = await routerProxy.getFee(amountIn)
        const amountsOut = await router.getAmountsOut(amountIn.sub(fee), path)
        const amountOut = amountsOut[amountsOut.length - 1]

        // carol approve the transfer
        await tokenA.connect(carol).approve(routerProxy.address, amountIn)

        // collect data before swap
        const prevBalances = await getBalances()

        const tx = await routerProxy.connect(carol).swapExactTokensForETH(
            amountIn,
            0,
            path,
            carol.address,
            deadline 
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas).add(amountOut))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(amountIn))
    }

    it("routerProxy: swap exact tokens for ETH", async () => {
        amountIn = randomNumber(0, 500)
        await swapExactTokensForETH(amountIn)
    })

    async function swapETHForExactTokens(amountOut) {
        const liquidityA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // set the tokens to swap
        const path = [weth.address, tokenA.address]

        // set the amountOut and get the amountIn and fee
        amountOut = expandTo18Decimals(amountOut)
        const amountsIn = await router.getAmountsIn(amountOut, path)
        const amountIn = amountsIn[0]
        const fee = await routerProxy.getFee(amountIn)

        // collect data before swap
        const prevBalances = await getBalances()
    
        const tx = await routerProxy.connect(carol).swapETHForExactTokens(
            amountOut,
            path,
            carol.address,
            deadline,
            { value: amountIn.add(fee) }
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.eth).to.eq(prevBalances.bobby.eth.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas).sub(amountIn).sub(fee))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.add(amountOut))
    }

    it("routerProxy: swap ETH for exact tokens", async () => {
        amountIn = randomNumber(0, 500)
        await swapETHForExactTokens(amountIn)
    })

    it("routerProxy: swap ETH for exact tokens returns surplus ETH", async () => {
        const liquidityA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // set the tokens to swap
        const path = [weth.address, tokenA.address]

        // set the amountOut and get the amountIn and fee
        const amountOut = expandTo18Decimals(100)
        const amountsIn = await router.getAmountsIn(amountOut, path)
        const amountIn = amountsIn[0]
        const fee = await routerProxy.getFee(amountIn)

        // collect data before swap
        const prevBalances = await getBalances()
    
        const tx = await routerProxy.connect(carol).swapETHForExactTokens(
            amountOut,
            path,
            carol.address,
            deadline,
            { value: expandTo18Decimals(500) }  // Pass more than enough ETH to check that the surplus is returned
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.eth).to.eq(prevBalances.bobby.eth.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas).sub(amountIn).sub(fee))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.add(amountOut))
    })

    async function swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn) {
        // alice adds liquidity
        const liquidityA = expandTo18Decimals(1000)
        const liquidityB = expandTo18Decimals(1000)
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        // alice transfers tokens to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount)

        // set the tokens to swap
        const path = [tokenA.address, tokenB.address]

        // set the amountIn and get the fee and amountOut
        amountIn = expandTo18Decimals(amountIn)
        const fee = await routerProxy.getFee(amountIn)
        const amountsOut = await router.getAmountsOut(amountIn.sub(fee), path)
        const amountOut = amountsOut[amountsOut.length - 1] 

        // carol approve the transfer
        await tokenA.connect(carol).approve(routerProxy.address, amountIn)

        // collect data before swap
        const prevBalances = await getBalances()

        // carol swaps
        const tx = await routerProxy.connect(carol).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            0,
            path,
            carol.address,
            deadline,
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(amountIn))
        expect(postBalances.carol.tokenB).to.eq(prevBalances.carol.tokenB.add(amountOut))
    }

    it("routerProxy: swap exact tokens for tokens supporting fee on transfer tokens", async () => {
        amountIn = randomNumber(0, 500)
        await swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn)
    })

    async function swapExactETHForTokensSupportingFeeOnTransferTokens(amountIn) {
        const liquidityA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // set the tokens to swap
        const path = [weth.address, tokenA.address]

        // set the amountIn and get the fee and amountOut 
        amountIn = expandTo18Decimals(amountIn)
        const fee = await routerProxy.getFee(amountIn)
        const amountsOut = await router.getAmountsOut(amountIn.sub(fee), path)
        const amountOut = amountsOut[amountsOut.length - 1]

        // collect data before swap
        const prevBalances = await getBalances()

        const tx = await routerProxy.connect(carol).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOut,
            path,
            carol.address,
            deadline,
            { value: amountIn }
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.eth).to.eq(prevBalances.bobby.eth.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas).sub(amountIn))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.add(amountOut))

    }

    it("routerProxy: swap exact ETH for tokens supporting fee on transfer tokens", async () => {
        amountIn = randomNumber(0, 500)
        await swapExactETHForTokensSupportingFeeOnTransferTokens(amountIn)
    })

    async function swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn) {
        // alice add liquidity
        const liquidityA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)
   
        // alice transfer tokenA to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

        // set the tokens to swap
        const path = [tokenA.address, weth.address]

        // set the amountIn and get the fee and amountOut 
        amountIn = expandTo18Decimals(amountIn)
        const fee = await routerProxy.getFee(amountIn)
        const amountsOut = await router.getAmountsOut(amountIn.sub(fee), path)
        const amountOut = amountsOut[amountsOut.length - 1]

        // carol approve the transfer
        await tokenA.connect(carol).approve(routerProxy.address, amountIn)

        // collect data before swap
        const prevBalances = await getBalances()

        const tx = await routerProxy.connect(carol).swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            0,
            path,
            carol.address,
            deadline
        )

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas).add(amountOut))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(amountIn))

    }

    it("routerProxy: swap exact tokens for ETH supporting fee on transfer tokens", async () => {
        amountIn = randomNumber(0, 500)
        await swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn)
    })
})
