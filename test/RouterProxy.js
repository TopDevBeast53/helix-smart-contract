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

    async function getAmountOut(amountIn, fee, path) {
        const amountsOut = await router.getAmountsOut(
                expandTo18Decimals(amountIn).sub(fee),
                path
            )
        return amountsOut[amountsOut.length - 1]
    }

    async function getAmountIn(amountOut, path) {
        const amountsIn = await router.getAmountsIn(
            amountOut,
            path
        )
        return amountsIn[0]
    }

    async function addLiquidityEth(liquidityA, liquidityEth, from, to) {
        await tokenA.connect(from).approve(router.address, expandTo18Decimals(liquidityA))
        await router.connect(from).addLiquidityETH(
            tokenA.address,
            expandTo18Decimals(liquidityA),
            0,
            0,
            to.address,
            deadline,
            { value: expandTo18Decimals(liquidityEth) }
        )
    }

    it("routerProxy: swap exact tokens for tokens", async () => {
        // alice adds liquidity
        const liquidityA = 1000
        const liquidityB = 1000
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        // alice transfers tokens to carol
        const transferAmount = 1000
        await transfer(transferAmount, alice, carol)

        // set the tokens to swap
        const path = [tokenA.address, tokenB.address]

        // set the amountIn and get the fee and amountOut
        const amountIn = 100
        const fee = await getFee(amountIn)
        const amountOut = await getAmountOut(amountIn, fee, path)

        // carol approve the transfer
        await approve(amountIn, carol)

        // collect data before swap
        const prevBalances = await getBalances()

        // carol swaps
        const tx = await routerProxy.connect(carol).swapExactTokensForTokens(
            expandTo18Decimals(amountIn),
            0,
            path,
            carol.address,
            deadline,
        )

        // bobby withdraw swap token
        await withdraw(tokenA)

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(expandTo18Decimals(amountIn)))
        expect(postBalances.carol.tokenB).to.eq(prevBalances.carol.tokenB.add(amountOut))
    })

    it("routerProxy: swap tokens for exact tokens", async () => {
        // alice adds liquidity
        const liquidityA = 1000
        const liquidityB = 1000
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        // alice transfers tokens to carol
        const transferAmount = 1000
        await transfer(transferAmount, alice, carol)

        // set the tokens to swap
        const path = [tokenA.address, tokenB.address]

        // set the amountOut and get the fee and amountIn
        const amountOut = 100
        const amountIn = (await router.getAmountsIn(expandTo18Decimals(amountOut), path))[0]
        const fee = await routerProxy.getFee(amountIn)

        // carol approve the transfer
        await approve(amountIn + fee, carol)

        // collect data before swap
        const prevBalances = await getBalances()

        // carol swap on routerProxy
        const tx = await routerProxy.connect(carol).swapTokensForExactTokens(
            expandTo18Decimals(amountOut),
            expandTo18Decimals(amountIn + fee),
            path,
            carol.address,
            deadline 
        )

        // bobby withdraw swap token
        await withdraw(tokenA)

        // collect data after swap
        const gas = await getGas(tx)
        const postBalances = await getBalances()

        // check the results
        // bobby
        expect(postBalances.bobby.tokenA).to.eq(prevBalances.bobby.tokenA.add(fee))
        
        // carol
        expect(postBalances.carol.eth).to.eq(prevBalances.carol.eth.sub(gas))
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(amountIn.add(fee)))
        expect(postBalances.carol.tokenB).to.eq(prevBalances.carol.tokenB.add(expandTo18Decimals(amountOut)))
    })

    it("routerProxy: swap exact ETH for tokens", async () => {
        // alice add pair (weth, B) to router
        const liquidityA = 1000
        const liquidityEth = 1000
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // set the tokens to swap
        const path = [weth.address, tokenA.address]

        // set the amountIn and get the fee and amountOut
        const amountIn = expandTo18Decimals(100)
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
    })

    it("routerProxy: swap tokens for exact ETH", async () => {
        const liquidityA = 1000
        const liquidityEth = 1000
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // alice transfer tokenA to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

        // set the tokens to swap
        const path = [tokenA.address, weth.address]

        // set the amountOut and get the amountIn and fee
        const amountOut = expandTo18Decimals(100)
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
    })

    it("routerProxy: swap exact tokens for ETH", async () => {
        const liquidityA = 1000
        const liquidityEth = 1000
        await addLiquidityEth(liquidityA, liquidityEth, alice, alice)

        // alice transfer tokenA to carol
        const transferAmount = expandTo18Decimals(1000)
        await tokenA.connect(alice).transfer(carol.address, transferAmount) 

        // set the tokens to swap
        const path = [tokenA.address, weth.address]

        // set the amountIn and get the fee and amountOut 
        const amountIn = expandTo18Decimals(100)
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
    })

    /*
    it("routerProxy: swap ETH for exact tokens", async () => {
        const liquidityA = 1000
        const liquidityEth = 1000
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

        await routerProxy.connect(carol).swapETHForExactTokens(
            amountOut,
            path,
            carol.address,
            deadline,
            { value: amountIn.add(fee) }
        )
    })
    */

    it("routerProxy: swap exact tokens for tokens supporting fee on transfer tokens", async () => {
        // alice adds liquidity
        const liquidityA = 1000
        const liquidityB = 1000
        await addLiquidity(liquidityA, liquidityB, alice, alice)

        // alice transfers tokens to carol
        const transferAmount = 1000
        await transfer(transferAmount, alice, carol)

        // set the tokens to swap
        const path = [tokenA.address, tokenB.address]

        // set the amountIn and get the fee and amountOut
        const amountIn = 100
        const fee = await getFee(amountIn)
        const amountOut = await getAmountOut(amountIn, fee, path)

        // carol approve the transfer
        await approve(amountIn, carol)

        // collect data before swap
        const prevBalances = await getBalances()

        // carol swaps
        const tx = await routerProxy.connect(carol).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            expandTo18Decimals(amountIn),
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
        expect(postBalances.carol.tokenA).to.eq(prevBalances.carol.tokenA.sub(expandTo18Decimals(amountIn)))
        expect(postBalances.carol.tokenB).to.eq(prevBalances.carol.tokenB.add(amountOut))
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
