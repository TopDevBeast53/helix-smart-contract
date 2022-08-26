const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
describe("RouterProxy", () => {
    let alice, bobby, carol, david, edith
    let routerProxy
    let router
    let tokenA
    let tokenB

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)

        routerProxy = fixture.routerProxy
        router = fixture.router
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
    })

    it("routerProxy: initialized correctly", async () => {
        expect(await routerProxy.owner()).to.eq(alice.address)
        expect(await routerProxy.router()).to.eq(router.address)
        expect(await routerProxy.partner()).to.eq(bobby.address)
        expect(await routerProxy.percentDecimals()).to.eq(100000)
    })

    it("routerProxy: swap exact tokens for tokens", async () => {
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
        await routerProxyCarol.swapExactTokensForTokens(
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
})
