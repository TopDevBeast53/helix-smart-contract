const { expect } = require("chai")                                                                   
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
                                                                                                   
const { MaxUint256 } = require("legacy-ethers/constants")
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

describe('Migrator', () => {
    let migrator
    let token0
    let token1
    let pair
    let router
    let externalFactory
    let externalRouter
    let externalPair

    const allowance = 10000000
    const amountToken0 = 100000
    const amountToken1 = 100000
    const indexToken0 = 0
    const indexToken1 = 1

    let wallet

    beforeEach(async () => {
        [wallet] = await ethers.getSigners()
        
        // Load the contracts from fixture.
        const fixture = await loadFixture(fullExchangeFixture)
        const factory = fixture.factory
        migrator = fixture.migrator
        router = fixture.router
        externalFactory = fixture.externalFactory
        externalRouter = fixture.externalRouter
        const tokenA = fixture.tokenA
        const tokenB = fixture.tokenB

        const pairContractFactory = await ethers.getContractFactory("HelixPair")

        await factory.createPair(tokenA.address, tokenB.address)
        const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        pair = pairContractFactory.attach(pairAddress).connect(wallet)

        const token0Address = (await pair.token0()).address
        token0 = tokenA.address === token0Address ? tokenB : tokenA
        token1 = tokenA.address === token0Address ? tokenA : tokenB

        // Use existing tokens 0 and 1 to add a new pair (externalPair) 
        // to the external factory.
        // wrap in try to handle pair already exists error
        await externalFactory.createPair(token0.address, token1.address)

        const externalPairAddress = await externalFactory.getPair(token0.address, token1.address)
        externalPair = pairContractFactory.attach(externalPairAddress).connect(wallet) 
       
        // Permit the contracts to transfer large amounts of funds.
        await externalPair.approve(migrator.address, MaxUint256)
        await token0.approve(externalRouter.address, MaxUint256)
        await token1.approve(externalRouter.address, MaxUint256)

        // Seed the external router with amountToken0 and amountToken1 of staked tokens.
        await externalRouter.addLiquidity(
            token0.address,                 // address of token 0
            token1.address,                 // address of token 1
            bigNumberify(amountToken0),     // desired amount of token 0 to add
            bigNumberify(amountToken1),     // desired amount of token 1 to add
            0,                              // minimum amount of token 0 to add
            0,                              // minimum amount of token 1 to add
            wallet.address,                 // liquidity tokens recipient
            MaxUint256                     // deadline until tx revert
        )
    })

    it('migrator: test migrate liquidity preparedness', async () => {
        expect(await token0.allowance(wallet.address, externalRouter.address)).to.eq(MaxUint256)
        expect(await token1.allowance(wallet.address, externalRouter.address)).to.eq(MaxUint256)

        expect(await externalPair.allowance(wallet.address, migrator.address)).to.eq(MaxUint256)
        expect(await externalPair.balanceOf(wallet.address)).to.eq(99000)

        expect(await pair.balanceOf(wallet.address)).to.eq(0)
    })

    it('migrator: migrate liquidity from external DEX', async () => {
        // Before migrating liquidity
        // External reserves of tokens A and B should be 100000
        expect((await externalPair.getReserves())[indexToken0]).to.eq(100000)
        expect((await externalPair.getReserves())[indexToken1]).to.eq(100000)

        // and reserves of tokens A and B should be 0.
        expect((await pair.getReserves())[indexToken0]).to.eq(0)
        expect((await pair.getReserves())[indexToken1]).to.eq(0)

        await migrator.migrateLiquidity(
            token0.address,                 // tokenA
            token1.address,                 // tokenB
            externalPair.address,           // lpToken
            externalRouter.address         // externalRouter
        )

        // After migrating liquidity
        // External reserves of tokens A and B should be 1000
        expect((await externalPair.getReserves())[indexToken0]).to.eq(1000)
        expect((await externalPair.getReserves())[indexToken1]).to.eq(1000)

        // and reserves of tokens A and B should be 99000.
        expect((await pair.getReserves())[indexToken0]).to.eq(99000)
        expect((await pair.getReserves())[indexToken1]).to.eq(99000)
    })

    it('migrator: emits MigrateLiquidity event', async () => {
        await expect(migrator.migrateLiquidity(
            token0.address,                 // tokenA
            token1.address,                 // tokenB
            externalPair.address,           // lpToken
            externalRouter.address          // externalRouter
        )).to.emit(migrator, "MigrateLiquidity")
    })

    it('migrator: set the router', async () => {
        const prevRouter = await migrator.router()
        const newRouter = '0xEDAAd9a587E8887685f69a698F4929E01A6A5854'    // Arbitrary, non-zero address.

        await migrator.setRouter(newRouter)

        expect(await migrator.router()).to.not.eq(prevRouter)
        expect(await migrator.router()).to.eq(newRouter)
    })
})
