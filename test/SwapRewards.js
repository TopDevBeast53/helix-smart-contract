const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

describe('SwapRewards', () => {
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

    let wallet, user

    beforeEach(async () => {
        [wallet, user] = await ethers.getSigners()

        // Load all the contracts used in creating swapRewards contract.
        const fixture = await loadFixture(fullExchangeFixture)
        factory = fixture.factory
        router = fixture.router
        oracleFactory = fixture.oracleFactory
        refReg = fixture.referralRegister
        swapRewards = fixture.swapRewards
        helixToken = fixture.helixToken
        helixNFT = fixture.helixNFT
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB

        await initPairs(tokenA, tokenB)

        // Add the user as the wallet's referrer
        await refReg.addReferrer(user.address)
    })

    async function initPairs(token0, token1) {
        // initialize all the valid swap pairs for the tokens 0, 1, Hp, and Helix
        const amount0 = expandTo18Decimals(900)
        const amount1 = expandTo18Decimals(300)
        const helixAmount = expandTo18Decimals(700)

        await initPair(token0, amount0, token1, amount1)
        await initPair(token0, amount0, helixToken, helixAmount)
        await initPair(token1, amount1, helixToken, helixAmount)
    }

    async function initPair(token0, amount0, token1, amount1) {
        await factory.createPair(token0.address, token1.address)

        await token0.approve(router.address, expandTo18Decimals(10000))
        await token1.approve(router.address, expandTo18Decimals(10000))

        await router.addLiquidity(
            token0.address, 
            token1.address, 
            amount0, 
            amount1, 
            0, 
            0, 
            wallet.address, 
            expandTo18Decimals(10000)
        )
    }

    it('swapRewards: output INIT CODE HASH', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`)
    })

    it('swapRewards: factory is initialized', async () => {
        // pairs are created
        expect(await factory.getPair(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero)
        expect(await factory.getPair(tokenB.address, helixToken.address)).to.not.eq(constants.AddressZero)
    })

    it('swapRewards: oracle factory is initialized', async () => {
        // oracle pairs are created
        expect(await oracleFactory.getOracle(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero)
        expect(await oracleFactory.getOracle(tokenB.address, helixToken.address)).to.not.eq(constants.AddressZero)
    })

    it('swapRewards: router is initialized', async () => {
        expect(await router.factory()).to.eq(factory.address)
        expect(await router.swapRewards()).to.eq(swapRewards.address)
    })

    it('swapRewards: pair (A, B) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        const pairContractFactory = await ethers.getContractFactory("HelixPair")                      
        let pair = pairContractFactory.attach(pairAddress).connect(wallet) 
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: pair (B, HELIX) is initialized', async () => {
        let pairAddress = await factory.getPair(tokenB.address, helixToken.address)
        const pairContractFactory = await ethers.getContractFactory("HelixPair")                      
        let pair = pairContractFactory.attach(pairAddress).connect(wallet) 
        let [reserves0, reserves1, ] = await pair.getReserves()
        expect(reserves0).to.be.above(0)
        expect(reserves1).to.be.above(0)
    })

    it('swapRewards: referral register is initialized', async () => {
        expect(await refReg.referrers(wallet.address)).to.eq(user.address)
        expect(await refReg.isRecorder(swapRewards.address)).to.be.true
    })

    it('swapRewards: swap when paused fails', async () => {
        await swapRewards.pause();

        const account = wallet.address
        const referrer = user.address

        // Mimic the wallet as the router
        await swapRewards.setRouter(account)

        // Store the previous values of interest before swap 
        const prevAccountHelix = await helixToken.balanceOf(account)
        const prevReferrerHelix = await refReg.rewards(referrer)

        // Swap A for B and collect rewards
        await expect(swapRewards.swap(account, tokenB.address, 1000))
            .to.be.revertedWith("Pausable: paused")
    })

    it('swapRewards: swap tokens from swapRewards', async () => {
        // This test is used as a sanity check to make sure that no errors
        // are occuring in swapRewards before calling swapRewards from router.

        const account = wallet.address
        const referrer = user.address

        // Mimic the wallet as the router
        await swapRewards.setRouter(account)

        // Store the previous values of interest before swap 
        const prevAccountHelix = await helixToken.balanceOf(account)
        const prevReferrerHelix = await refReg.rewards(referrer)

        // Swap A for B and collect rewards
        await swapRewards.swap(account, tokenB.address, 1000)

        // Get the updated values after swap
        const newAccountHelix = await helixToken.balanceOf(account)
        const newReferrerHelix = await refReg.rewards(referrer)

        // We don't actually expect any rewards to accrue because a swap hasn't been triggered.
        expect(prevAccountHelix).to.be.at.most(newAccountHelix)
        expect(prevReferrerHelix).to.be.at.most(newReferrerHelix)
    })

    it('swapRewards: swap tokens from router', async () => {
        const account = wallet.address
        const referrer = user.address

        // Store the previous values of interest before swap 
        const prevAccountHelix = await helixToken.balanceOf(account)
        const prevReferrerHelix = await refReg.rewards(referrer)

        // Swap twice and earn rewards
        await router.swapExactTokensForTokens(
            expandTo18Decimals(100), 
            0, 
            [tokenA.address, tokenB.address], 
            wallet.address, 
            expandTo18Decimals(10000)
        )
            
        await router.swapExactTokensForTokens(
            expandTo18Decimals(90), 
            0, 
            [tokenB.address, helixToken.address], 
            wallet.address, 
            expandTo18Decimals(10000)
        )

        // Get the updated values after swap
        const newAccountHelix = await helixToken.balanceOf(account)
        const newReferrerHelix = await refReg.rewards(referrer)

        expect(prevAccountHelix).to.be.at.most(newAccountHelix)
        expect(prevReferrerHelix).to.be.at.most(newReferrerHelix)
    })
    
    function print(str) {
        if (verbose) console.log(str)
    }
})
