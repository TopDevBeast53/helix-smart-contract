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

    const liquidityEth = expandTo18Decimals(5000)
    const liquidityA = expandTo18Decimals(5000)
    const liquidityB = expandTo18Decimals(5000)
    const transferAmount = expandTo18Decimals(5000)

    minAmount = 1
    maxAmount = 100

    const partnerPercents = [1, 50, 500, 5000]
    const swapAmounts = [1, 5, 10, 50, 100, 500]

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

    it("routerProxy: set and get partner percent", async () => {
        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let j = 0; j < swapAmounts.length; j++) {
                const amountIn = expandTo18Decimals(swapAmounts[j])
                expect(await routerProxy.getFee(amountIn)).to.eq(getFee(amountIn, partnerPercent))
            }
        }

        await expect(routerProxy.connect(bobby).setPartnerPercent(100001))
            .to.be.revertedWith("Invalid partner percent")
    })

    it("routerProxy: swap exact tokens for tokens random", async () => {
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = randomNumber(minAmount, maxAmount)
                await swapExactTokensForTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact tokens for tokens", async () => {
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapExactTokensForTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap tokens for exact tokens random", async () => {
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountOut = randomNumber(minAmount, maxAmount)
                await swapTokensForExactTokens(amountOut)
            }
        }
    })

    it("routerProxy: swap tokens for exact tokens", async () => {
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapTokensForExactTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact ETH for tokens random", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = randomNumber(minAmount, maxAmount)
                await swapExactETHForTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact ETH for tokens", async () => {
        await addLiquidityEth(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapExactETHForTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap tokens for exact ETH random", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountOut = randomNumber(minAmount, maxAmount)
                await swapTokensForExactETH(amountOut)
            }
        }
    })

    it("routerProxy: swap tokens for exact ETH", async () => {
        await addLiquidityEth(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapTokensForExactETH(amountIn)
            }
        }
    })

    it("routerProxy: swap exact tokens for ETH random", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = randomNumber(minAmount, maxAmount)
                await swapExactTokensForETH(amountIn)
            }
        }
    })

    it("routerProxy: swap exact tokens for ETH", async () => {
        await addLiquidityEth(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapExactTokensForETH(amountIn)
            }
        }
    })

    it("routerProxy: swap ETH for exact tokens random", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = randomNumber(minAmount, maxAmount)
                await swapETHForExactTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap ETH for exact tokens", async () => {
        await addLiquidityEth(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapETHForExactTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact tokens for tokens supporting fee on transfer tokens random", async () => {
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = randomNumber(minAmount, maxAmount)
                await swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact tokens for tokens supporting fee on transfer tokens", async () => {
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact ETH for tokens supporting fee on transfer tokens random", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = randomNumber(minAmount, maxAmount)
                await swapExactETHForTokensSupportingFeeOnTransferTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact ETH for tokens supporting fee on transfer tokens", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapExactETHForTokensSupportingFeeOnTransferTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact tokens for ETH supporting fee on transfer tokens random", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = randomNumber(minAmount, maxAmount)
                await swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn)
            }
        }
    })

    it("routerProxy: swap exact tokens for ETH supporting fee on transfer tokens", async () => {
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        for (let i = 0; i < partnerPercents.length; i++) {
            const partnerPercent = partnerPercents[i]
            await routerProxy.connect(bobby).setPartnerPercent(partnerPercent)

            for (let i = 0; i < swapAmounts.length; i++) {
                amountIn = swapAmounts[i]
                await swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn)
            }
        }
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

    function randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min) + min)
    }

    async function swapExactTokensForTokens(amountIn) {
        const path = [tokenA.address, tokenB.address]

        // alice transfers tokens to carol
        await tokenA.connect(alice).transfer(carol.address, transferAmount)

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

    async function swapTokensForExactTokens(amountOut) {
        const path = [tokenA.address, tokenB.address]

        // alice transfers tokens to carol
        await tokenA.connect(alice).transfer(carol.address, transferAmount)

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

    async function swapExactETHForTokens(amountIn) {
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

    async function swapTokensForExactETH(amountOut) {
        const path = [tokenA.address, weth.address]

        // alice transfer tokenA to carol
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

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

    async function swapExactTokensForETH(amountIn) {
        const path = [tokenA.address, weth.address]

        // alice transfer tokenA to carol
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

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

    async function swapETHForExactTokens(amountOut) {
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

    async function swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn) {
        const path = [tokenA.address, tokenB.address]

        // alice transfers tokens to carol
        await tokenA.connect(alice).transfer(carol.address, transferAmount)

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

    async function swapExactETHForTokensSupportingFeeOnTransferTokens(amountIn) {
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

    async function swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn) {
        const path = [tokenA.address, weth.address]

        // alice transfer tokenA to carol
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

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
})
