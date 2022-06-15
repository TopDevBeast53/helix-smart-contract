const { expect } = require("chai")                                                                                                      
                                                                                                      
const { waffle } = require("hardhat")                                                                 
const { loadFixture } = waffle                                                                        
                                                                                                      
const { bigNumberify } = require("legacy-ethers/utils")                                               
const { expandTo18Decimals } = require("./shared/utilities")                                          
const { fullExchangeFixture } = require("./shared/fixtures")                                          
                                                                                                      
const { constants } = require("@openzeppelin/test-helpers")                                           
                                                                                                      
const verbose = true  

describe('MasterChef', () => {
    let wallet

    let helixToken
    let chef
    let token0
    let token1
    let router
    let factory
      
    beforeEach(async function() {
        [wallet] = await ethers.getSigners()
    
        const fixture = await loadFixture(fullExchangeFixture)
        helixToken = fixture.helixToken
        chef = fixture.masterChef
        router = fixture.router
        factory = fixture.factory
        const tokenA = fixture.tokenA
        const tokenB = fixture.tokenB

        // Locally create the pair
        await factory.createPair(tokenA.address, tokenB.address)
        const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        const pairContractFactory = await ethers.getContractFactory("HelixPair")
        let pair = pairContractFactory.attach(pairAddress).connect(wallet)

        const token0Address = (await pair.token0()).address
        token0 = tokenA.address === token0Address ? tokenB : tokenA
        token1 = tokenA.address === token0Address ? tokenA : tokenB

        await helixToken.addMinter(chef.address)
    })

    it('masterChef: chef is minter', async () => {
        const isChefMinter = await helixToken.isMinter(chef.address)
        expect(isChefMinter).to.eq(true)
    })

    it('masterChef: add liquidity and farm', async () => {
        // Prepare
        await token0.approve(router.address, expandTo18Decimals(10000))
        await token1.approve(router.address, expandTo18Decimals(10000))
        await router.addLiquidity(
            token0.address,
            token1.address,
            bigNumberify(100000),
            bigNumberify(100000),
            0,
            0,
            wallet.address,
            expandTo18Decimals(10000)
        )

        const pairAddress = await factory.getPair(token0.address, token1.address)
        const pairContractFactory = await ethers.getContractFactory("HelixPair")
        let lpToken = pairContractFactory.attach(pairAddress).connect(wallet)

        const balanceOfPair = await lpToken.balanceOf(wallet.address)
        expect(balanceOfPair).to.eq(99000)

        // Setup chef by adding a pool for newly added pair
        await chef.add(2000, lpToken.address, true)
        const poolsCount = await chef.poolLength()
        expect(poolsCount).to.eq(2)

        // Deposit LP token to chef
        await lpToken.approve(chef.address, expandTo18Decimals(10000))
        await chef.deposit(1, 99000)

        // Wait 100 blocks
        await mineBlocks(100)
    
        // Withdraw LP token from chef & ensure rewards have been given
        const helixBalanceBefore = await helixToken.balanceOf(wallet.address)
        const previousBalanceOfLp = await lpToken.balanceOf(wallet.address)
        expect(previousBalanceOfLp).to.eq(0)
        expect(helixBalanceBefore).to.eq("160000000000000000000000000")

        /*
        await chef.updatePool(1)
        const pool  = await chef.poolInfo(1)
        const user = await chef.userInfo(1, wallet.address)
        console.log(`pool ${pool}`)
        console.log(`user ${user}`)
        */

        await chef.withdraw(1, 99000)

        const newHelixBalance = await helixToken.balanceOf(wallet.address)
        const newBalanceOfLp = await lpToken.balanceOf(wallet.address)
        expect(newBalanceOfLp).to.eq(99000)
        expect(newHelixBalance).to.eq("160003722354999999999999999")
    })

    it('masterChef: stake helix', async () => {
        // Chef must already have a pool with id = 0 which is responsible
        // for staking helix

        // Prepare
        await helixToken.approve(chef.address, "10000000000000000000000000")

        // Stake
        await chef.enterStaking("1000000000000000000000000")
        const userBalanceAfterStaking = await helixToken.balanceOf(wallet.address)
        expect(userBalanceAfterStaking).to.eq("159000000000000000000000000")

        // Unstake
        await chef.leaveStaking("1000000000000000000000000")
        const userBalanceAfterUnStaking = await helixToken.balanceOf(wallet.address)
        expect(userBalanceAfterUnStaking).to.eq("160000058474260000000000000")
    })

    async function mineBlocks(n) {
        for (let i = 0; i < n; i++) {
            await ethers.provider.send('evm_mine')
        }
    }
})
