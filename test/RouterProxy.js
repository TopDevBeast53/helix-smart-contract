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
        await tokenA.connect(from).approve(router.address, expandTo18Decimals(amountA))
        await tokenB.connect(from).approve(router.address, expandTo18Decimals(amountB))
        await router.connect(from).addLiquidity(
            tokenA.address,
            tokenB.address,
            expandTo18Decimals(amountA),
            expandTo18Decimals(amountB),
            0,
            0,
            to.address,
            deadline
        )
    }

    async function transfer(amount, from, to) {
        await tokenA.connect(from).transfer(to.address, expandTo18Decimals(amount))
    }

    async function approve(amount, from) {
        const tokenAFrom = tokenA.connect(from)
        await tokenAFrom.approve(routerProxy.address, expandTo18Decimals(amount))
    }

    async function getBalancesOf(from) {
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
            alice: await getBalancesOf(alice),
            bobby: await getBalancesOf(bobby),
            carol: await getBalancesOf(carol),
            router: await getBalancesContract(router),
            routerProxy: await getBalancesContract(routerProxy),
        }
    }

    async function getFee(amount) {
        return await routerProxy.getFee(expandTo18Decimals(amount))
    }

    async function getGas(tx) {
        const receipt = await tx.wait()
        return receipt.gasUsed.mul(receipt.effectiveGasPrice)
    }

    async function withdraw(token) {
        const balance = await token.balanceOf(routerProxy.address)
        await routerProxy.connect(bobby).withdraw(tokenA.address, bobby.address, balance)
    }

    /*
    it("routerProxy: swap exact tokens for tokens", async () => {
        const liquidityA = 1000
        const liquidityB = 500
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        const transferAmount = 1000
        await transfer(transferAmount, alice, carol)

        const swapAmount = 100
        await approve(swapAmount, carol)

        const prevBalances = await getBalances()
        console.log(prevBalances)

        const tx = await routerProxy.connect(carol).swapExactTokensForTokens(
            expandTo18Decimals(swapAmount),
            0,
            [tokenA.address, tokenB.address],
            carol.address,
            deadline,
        )
        await withdraw(tokenA)

        const postBalances = await getBalances()
        console.log(postBalances)
        const gas = await getGas(tx)
        const fee = await getFee(swapAmount)

        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(swapAmount))
    })
    
    */

    it("routerProxy: swap exact tokens for tokens", async () => {
                        const liquidityA = 1000
                        const liquidityB = 500
                        await addLiquidity(liquidityA, liquidityB, alice, alice)

                        const swapAmount = 100
                        await transfer(swapAmount, alice, carol)
                        await approve(swapAmount, carol)

                        const prevBalances = await getBalances()


                        // expect routerProxy tokenA balance to be 0 before swap
                        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(0)

                        // carol swap on routerProxy
                        const routerProxyCarol = routerProxy.connect(carol)
                        const tx = await routerProxyCarol.swapExactTokensForTokens(
                            expandTo18Decimals(swapAmount),
                            0,
                            [tokenA.address, tokenB.address],
                            carol.address,
                            deadline,
                        )

                        const gas = await getGas(tx)
                        const fee = await getFee(swapAmount)

                        // carol receive tokenB
                        expect(await tokenB.balanceOf(carol.address)).to.eq("45206683096833228655")

                        // routerProxy collects fee
                        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(fee)
    })


    it("routerProxy: swap tokens for exact tokens", async () => {
        // alice add pair (A, B) to router
        await tokenA.approve(router.address, expandTo18Decimals(1000))
        await tokenB.approve(router.address, expandTo18Decimals(500))
        await router.addLiquidity(
            tokenA.address,
            tokenB.address,
            expandTo18Decimals(1000),
            expandTo18Decimals(500),
            0,
            0,
            alice.address,
            expandTo18Decimals(10000)
        )

        // alice transfer A to carol
        await tokenA.transfer(carol.address, expandTo18Decimals(1000))

        // bobby set routerProxy fee percent
        const routerProxyBobby = routerProxy.connect(bobby)
        await routerProxyBobby.setPartnerPercent(500)

        const expectedAmountsIn = await router.getAmountsIn(
            expandTo18Decimals(50), 
            [tokenA.address, tokenB.address]
        )
        const expectedFee = await routerProxy.getFee(expectedAmountsIn[0])
        
        // carol approve transfer tokenA to routerProxy
        const tokenACarol = tokenA.connect(carol)
        await tokenACarol.approve(routerProxy.address, expectedAmountsIn[0].add(expectedFee))

        // expect carol tokenB balance to be 0 before swap

        expect(await tokenB.balanceOf(carol.address)).to.eq(0)

        // expect routerProxy tokenA balance to be 0 before swap
        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(0)
        
        // carol swap on routerProxy
        const routerProxyCarol = routerProxy.connect(carol)
        await routerProxyCarol.swapTokensForExactTokens(
            expandTo18Decimals(50),
            expandTo18Decimals(expectedAmountsIn[0].add(expectedFee)),
            [tokenA.address, tokenB.address],
            carol.address,
            expandTo18Decimals(100000)
        )

        // carol remaining balance tokenA
        const minExpectedCarolBalanceTokenA = expandTo18Decimals(1000).sub(expectedAmountsIn[0]).add(expectedFee).sub(expandTo18Decimals(2))
        expect(await tokenA.balanceOf(carol.address)).to.be.above(minExpectedCarolBalanceTokenA)
        
        // carol receive tokenB
        expect(await tokenB.balanceOf(carol.address)).to.eq(expandTo18Decimals(50))

        // routerProxy collects fee
        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(expectedFee)

        // bobby withdraw collected fee
        await routerProxyBobby.withdraw(tokenA.address, bobby.address, expectedFee)
        expect(await tokenA.balanceOf(bobby.address)).to.eq(expectedFee)
    })

    it("routerProxy: swap exact ETH for tokens", async () => {
        // alice add pair (weth, B) to router
        await weth.approve(router.address, expandTo18Decimals(1000))
        await tokenB.approve(router.address, expandTo18Decimals(1000))
        await router.addLiquidityETH(
            tokenB.address,
            expandTo18Decimals(1000),
            expandTo18Decimals(1000),
            expandTo18Decimals(1000),
            alice.address,
            expandTo18Decimals(10000),
            { value: expandTo18Decimals(1000) }
        )
    
        // bobby set routerProxy fee percent
        const routerProxyBobby = routerProxy.connect(bobby)
        await routerProxyBobby.setPartnerPercent(500)
        const expectedFee = await routerProxy.getFee(expandTo18Decimals(100))

        const prevAliceBalanceTokenB = await tokenB.balanceOf(alice.address)

        await routerProxy.swapExactETHForTokens(
            0,
            [weth.address, tokenB.address],
            alice.address,
            expandTo18Decimals(100000),
            { value: expandTo18Decimals(50) }
        )

        const postAliceBalanceTokenB = await tokenB.balanceOf(alice.address)

        // TODO Check WETH balance
        // routerProxy collects fee
        // expect(await weth.balanceOf(routerProxy.address)).to.eq(expectedFee)

        // bobby withdraw collected fee
        // await routerProxyBobby.withdraw(tokenA.address, bobby.address, expectedFee)
        // expect(await weth.balanceOf(bobby.address)).to.eq(expectedFee)
    })

    it("routerProxy: swap tokens for exact ETH", async () => {
        // alice add pair (A, B) to router
        await tokenA.approve(router.address, expandTo18Decimals(1000))
        await weth.approve(router.address, expandTo18Decimals(500))
        await router.addLiquidityETH(
            tokenA.address,
            expandTo18Decimals(1000),
            expandTo18Decimals(1000),
            expandTo18Decimals(500),
            alice.address,
            expandTo18Decimals(10000),
            { value: expandTo18Decimals(500) }
        )

        // alice transfer A to carol
        await tokenA.transfer(carol.address, expandTo18Decimals(1000))

        // bobby set routerProxy fee percent
        const routerProxyBobby = routerProxy.connect(bobby)
        await routerProxyBobby.setPartnerPercent(500)

        const expectedAmountsIn = await router.getAmountsIn(
            expandTo18Decimals(50), 
            [tokenA.address, weth.address]
        )
        const expectedFee = await routerProxy.getFee(expectedAmountsIn[0])
        
        // carol approve transfer tokenA to routerProxy
        const tokenACarol = tokenA.connect(carol)
        await tokenACarol.approve(routerProxy.address, expandTo18Decimals(1000))

        // expect carol tokenA balance to be 1000 before swap
        expect(await tokenA.balanceOf(carol.address)).to.eq(expandTo18Decimals(1000))

        // expect carol tokenB balance to be 0 before swap
        expect(await weth.balanceOf(carol.address)).to.eq(0)

        // expect routerProxy tokenA balance to be 0 before swap
        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(0)
        
        // carol swap on routerProxy
        const routerProxyCarol = routerProxy.connect(carol)
        await routerProxyCarol.swapTokensForExactETH(
            expandTo18Decimals(50),
            expandTo18Decimals(1000),
            [tokenA.address, weth.address],
            carol.address,
            expandTo18Decimals(100000),
        )

        // carol remaining balance tokenA
        const minExpectedCarolBalanceTokenA = expandTo18Decimals(1000).sub(expectedAmountsIn[0]).add(expectedFee).sub(expandTo18Decimals(2))
        expect(await tokenA.balanceOf(carol.address)).to.be.above(minExpectedCarolBalanceTokenA)
       
        // carol receive tokenB
        // TODO carol receive weth
        // expect(await tokenB.balanceOf(carol.address)).to.eq(expandTo18Decimals(50))

        // routerProxy collects fee
        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(expectedFee)

        // bobby withdraw collected fee
        await routerProxyBobby.withdraw(tokenA.address, bobby.address, expectedFee)
        expect(await tokenA.balanceOf(bobby.address)).to.eq(expectedFee)
    })

    it("routerProxy: swap exact tokens for ETH", async () => {
        // alice add pair (A, weth) to router
        await tokenA.approve(router.address, expandTo18Decimals(1000))
        await weth.approve(router.address, expandTo18Decimals(1000))
        await router.addLiquidityETH(
            tokenA.address,
            expandTo18Decimals(1000),
            0,
            0,
            alice.address,
            expandTo18Decimals(10000),
            { value: expandTo18Decimals(1000) }
        )

        // alice transfer A to carol
        await tokenA.transfer(carol.address, expandTo18Decimals(1000))
        expect(await tokenA.balanceOf(carol.address)).to.eq(expandTo18Decimals(1000))
        
        // carol approve transfer tokenA to routerProxy
        const tokenACarol = tokenA.connect(carol)
        await tokenACarol.approve(routerProxy.address, expandTo18Decimals(1000))

        // carol swap on routerProxy
        const routerProxyCarol = routerProxy.connect(carol)
        await routerProxyCarol.swapExactTokensForETH(
            expandTo18Decimals(100),
            0,
            [tokenA.address, weth.address],
            carol.address,
            expandTo18Decimals(100000)
        )

        const expectedFee = await routerProxy.getFee(expandTo18Decimals(100))

        expect(await tokenA.balanceOf(carol.address)).to.eq(expandTo18Decimals(1000).sub(expandTo18Decimals(100)))

        // routerProxy collects fee
        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(expectedFee)

        // bobby withdraw collected fee
        await routerProxy.connect(bobby).withdraw(tokenA.address, bobby.address, expectedFee)
        expect(await tokenA.balanceOf(bobby.address)).to.eq(expectedFee)
    })

    /*
    it("routerProxy: swap ETH for exact tokens", async () => {
        // alice add liquidity
        await weth.deposit({ value: expandTo18Decimals(1000) })
        await tokenB.approve(router.address, expandTo18Decimals(1000))
        await router.addLiquidityETH(
            tokenB.address,
            expandTo18Decimals(1000),
            0,
            0,
            alice.address,
            expandTo18Decimals(10000),
            { value: expandTo18Decimals(1000) }
        )

        // await weth.connect(carol).deposit({ value: expandTo18Decimals(1000) })
        // await weth.connect(carol).approve(router.address, expandTo18Decimals(1000))

        // carol swap eth for token b
        await routerProxy.connect(carol).swapETHForExactTokens(
            expandTo18Decimals(50),
            [weth.address, tokenB.address],
            carol.address,
            expandTo18Decimals(10000),
            { value: expandTo18Decimals(1000) }
        )
    })
    */

    it("routerProxy: swap exact tokens for tokens supporting fee on transfer tokens", async () => {
        // alice add pair (A, B) to router
        await tokenA.approve(router.address, expandTo18Decimals(1000))
        await tokenB.approve(router.address, expandTo18Decimals(500))
        await router.addLiquidity(
            tokenA.address,
            tokenB.address,
            expandTo18Decimals(1000),
            expandTo18Decimals(500),
            0,
            0,
            alice.address,
            expandTo18Decimals(10000)
        )

        // alice transfer A to carol
        await tokenA.transfer(carol.address, expandTo18Decimals(1000))

        // bobby set routerProxy fee percent
        const routerProxyBobby = routerProxy.connect(bobby)
        await routerProxyBobby.setPartnerPercent(500)
        const expectedFee = await routerProxy.getFee(expandTo18Decimals(100))
        
        // carol approve transfer tokenA to routerProxy
        const tokenACarol = tokenA.connect(carol)
        await tokenACarol.approve(routerProxy.address, expandTo18Decimals(100))

        // expect carol tokenB balance to be 0 before swap
        expect(await tokenB.balanceOf(carol.address)).to.eq(0)

        // expect routerProxy tokenA balance to be 0 before swap
        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(0)

        // carol swap on routerProxy
        const routerProxyCarol = routerProxy.connect(carol)
        await routerProxyCarol.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            expandTo18Decimals(100),
            0,
            [tokenA.address, tokenB.address],
            carol.address,
            expandTo18Decimals(100000)
        )

        // carol receive tokenB
        expect(await tokenB.balanceOf(carol.address)).to.eq("45206683096833228655")

        // routerProxy collects fee
        expect(await tokenA.balanceOf(routerProxy.address)).to.eq(expectedFee)

        // bobby withdraw collected fee
        await routerProxyBobby.withdraw(tokenA.address, bobby.address, expectedFee)
        expect(await tokenA.balanceOf(bobby.address)).to.eq(expectedFee)
    })

    it("routerProxy: swap exact ETH for tokens supporting fee on transfer tokens", async () => {
        await tokenB.approve(router.address, expandTo18Decimals(1000))
        await router.addLiquidityETH(
            tokenB.address,
            expandTo18Decimals(1000),
            0,
            0,
            alice.address,
            expandTo18Decimals(10000),
            { value: expandTo18Decimals(1000) }
        )

        expect(await carol.getBalance()).to.eq(expandTo18Decimals(10000))
        expect(await tokenB.balanceOf(carol.address)).to.eq(0)

        await routerProxy.connect(carol).swapExactETHForTokensSupportingFeeOnTransferTokens(
            expandTo18Decimals(50),
            [weth.address, tokenB.address],
            carol.address,
            expandTo18Decimals(10000),
            { value: expandTo18Decimals(5000) }
        )

        expect(await carol.getBalance()).to.be.below(expandTo18Decimals(10000))
        expect(await tokenB.balanceOf(carol.address)).to.be.above(49)
    })

    it("routerProxy: swap exact tokens for ETH supporting fee on transfer tokens", async () => {
        // alice add liquidity
        await tokenA.approve(router.address, expandTo18Decimals(1000)) 
        const liquidityTokenA = expandTo18Decimals(1000)
        const liquidityEth = expandTo18Decimals(1000)
        await router.addLiquidityETH(
            tokenA.address,
            liquidityTokenA,
            0,
            0,
            alice.address,
            deadline,
            { value: liquidityEth }
        )
    
        const swapAmount = expandTo18Decimals(100)

        // alice transfer token A to carol
        await tokenA.transfer(carol.address, swapAmount)

        // carol approve router swap A for Eth
        await tokenA.connect(carol).approve(routerProxy.address, swapAmount)

        const prevCarolTokenABalance = await tokenA.balanceOf(carol.address)
        const prevCarolEthBalance = await carol.getBalance()

        const path = [tokenA.address, weth.address]
        const expectedFee = await routerProxy.getFee(swapAmount)
        const expectedAmountOut = (await router.getAmountsOut(swapAmount.sub(expectedFee), path))[1]

        const tx = await routerProxy.connect(carol).swapExactTokensForETHSupportingFeeOnTransferTokens(
            swapAmount,
            0,
            path,
            carol.address,
            deadline
        )
        const receipt = await tx.wait()
        const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice)

        const postCarolTokenABalance = await tokenA.balanceOf(carol.address)
        const postCarolEthBalance = await carol.getBalance()

        // Check carol balances
        expect(postCarolTokenABalance).to.eq(prevCarolTokenABalance.sub(swapAmount))
        const expectedPostCarolEthBalance = prevCarolEthBalance.add(expectedAmountOut).sub(gasSpent)
        expect(postCarolEthBalance).to.eq(expectedPostCarolEthBalance)
    })
})
