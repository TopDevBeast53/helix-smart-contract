const { expect } = require("chai")                                                                   
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify } = require("legacy-ethers/utils")                                
const { expandTo18Decimals } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true      

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

const initialBalance = expandTo18Decimals(10000)

const SECONDS_PER_DAY = 86400
const bobbyInitialBalance = 1000

const NoWithdraw = 0
const Withdraw0 = 1
const Withdraw50 = 2
const Withdraw100 = 3

describe("Advisor Rewards", () => {
    let alice, bobby, carol, david, edith

    let advisorRewards
    let helixToken

    /// Contracts connected to by the other wallets
    let advisorRewardsBobby, advisorRewardsCarol, advisorRewardsDavid
    let helixTokenBobby, helixTokenCarol, helixTokenDavid

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()
        
        const fullExchange = await loadFixture(fullExchangeFixture)
        advisorRewards = fullExchange.advisorRewards
        helixToken = fullExchange.helixToken

        // Transfer to the contract the initial balance
        await helixToken.transfer(advisorRewards.address, initialBalance)
   
        // Connect the other wallets to the contract
        advisorRewardsBobby = advisorRewards.connect(bobby)
        advisorRewardsCarol = advisorRewards.connect(carol)
        advisorRewardsDavid = advisorRewards.connect(david)

        helixTokenBobby = helixToken.connect(bobby)
        helixTokenCarol = helixToken.connect(carol)
        helixTokenDavid = helixToken.connect(david)
    })

    it('advisorRewards: initialized with expected values', async () => {
        expect(await advisorRewards.helixToken()).to.eq(helixToken.address)
        expect(await advisorRewards.helixTokenBalance()).to.eq(initialBalance)
    })

    it("advisorRewards: get contract token balance", async () => {
        expect(await advisorRewards.helixTokenBalance()).to.eq(await helixToken.balanceOf(advisorRewards.address))
    })

    it('advisorRewards: add advisors', async () => {
        const advisors = [bobby.address, carol.address]
        const bobbyAmount = 50
        const carolAmount = 100
        const amounts = [bobbyAmount, carolAmount]
        
        await advisorRewards.addAdvisors(advisors, amounts)

        // advisors should receive airdropped funds
        expect((await advisorRewards.advisors(bobby.address)).initialBalance).to.eq(bobbyAmount)
        expect((await advisorRewards.advisors(carol.address)).initialBalance).to.eq(carolAmount)

        // and have a balance
        expect(await advisorRewards.getBalance(bobby.address)).to.eq(bobbyAmount)
        expect(await advisorRewards.getBalance(carol.address)).to.eq(carolAmount)
    })

    it('advisorRewards: add advisors with unequal argument arrays fails', async () => {
        const advisors = [bobby.address, carol.address]
        const bobbyAmount = 50
        const amounts = [bobbyAmount]
        
        await expect(advisorRewards.addAdvisors(advisors, amounts))
            .to.be.revertedWith("ArrayLengthMismatch")
    })

    it('advisorRewards: add advisors user with too many tokens fails', async () => {
        const advisors = [bobby.address, carol.address]
        const bobbyAmount = expandTo18Decimals(10000000000000)
        const carolAmount = 100
        const amounts = [bobbyAmount, carolAmount]
        
        await expect(advisorRewards.addAdvisors(advisors, amounts))
            .to.be.revertedWith("BalanceSumExceedsHelixTokenBalance")
    })

    it('advisorRewards: add advisors when amount sum exceeds contract balance fails', async () => {
        const contractBalance = await advisorRewards.helixTokenBalance()

        const advisors = [bobby.address, carol.address]
        const bobbyAmount = contractBalance.div(2)
        const carolAmount = contractBalance.div(2).add(1)
        const amounts = [bobbyAmount, carolAmount]
        
        await expect(advisorRewards.addAdvisors(advisors, amounts))
            .to.be.revertedWith("BalanceSumExceedsHelixTokenBalance")
    })

    it('advisorRewards: set withdraw phase', async () => {
        await advisorRewards.setWithdrawPhase(NoWithdraw);
        expect(await advisorRewards.withdrawPhase()).to.eq(0)

        await advisorRewards.setWithdrawPhase(Withdraw0);
        expect(await advisorRewards.withdrawPhase()).to.eq(1)

        await advisorRewards.setWithdrawPhase(Withdraw50);
        expect(await advisorRewards.withdrawPhase()).to.eq(2)

        await advisorRewards.setWithdrawPhase(Withdraw100);
        expect(await advisorRewards.withdrawPhase()).to.eq(3)
    })

    it('advisorRewards: set withdraw phase as non-owner fails', async () => {
        const phase = 0
        await expect(advisorRewardsBobby.setWithdrawPhase(phase))
            .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('advisorRewards: set withdraw phase with invalid phase fails', async () => {
        const invalidPhase = 6
        await expect(advisorRewards.setWithdrawPhase(invalidPhase))
            .to.be.revertedWith('revert')
    })

    it('advisorRewards: set withdraw phase emits set withdraw phase event', async () => {
        const phase = 0
        const phaseDuration = (await advisorRewards.WITHDRAW_PHASE_DURATION()).toNumber()
        await expect(advisorRewards.setWithdrawPhase(phase))
            .to.emit(advisorRewards, "SetWithdrawPhase")
    })

    it('advisorRewards: withdraw 50% of reward in Withdraw50 phase', async () => {
        const prevBalanceBobby = await helixToken.balanceOf(bobby.address)
        const prevBalanceContract = await advisorRewards.helixTokenBalance()

        // Add bobby as an advisor
        const initialBalance = expandTo18Decimals(1000)
        await advisorRewards.addAdvisors([bobby.address], [initialBalance])

        // Set the withdraw phase
        await advisorRewards.setWithdrawPhase(Withdraw50)

        const withdrawAmount = initialBalance.div(2)

        // Expect that bobby can't withdraw >50% of initial balance
        await expect(advisorRewardsBobby.withdraw(withdrawAmount.add(1)))
            .to.be.revertedWith("AmountExceedsMax")

        // Bobby withdraws 50% of reward
        await advisorRewardsBobby.withdraw(withdrawAmount)
    
        // Expect that bobby's account +amount and contract balance -amount
        expect(await helixToken.balanceOf(bobby.address)).to.eq(prevBalanceBobby.add(withdrawAmount))
        expect(await advisorRewards.helixTokenBalance()).to.eq(prevBalanceContract.sub(withdrawAmount))

        // Bobby shouldn't be able to withdraw any more
        await expect(advisorRewardsBobby.withdraw(1))
            .to.be.revertedWith("AmountExceedsMax")
    })

    it('advisorRewards: withdraw 100% of reward in Withdraw100 phase', async () => {
        const prevBalanceBobby = await helixToken.balanceOf(bobby.address)
        const prevBalanceContract = await advisorRewards.helixTokenBalance()

        // Add bobby as an advisor
        const intialBalance = expandTo18Decimals(1000)
        await advisorRewards.addAdvisors([bobby.address], [initialBalance])

        // Set the withdraw phase
        await advisorRewards.setWithdrawPhase(Withdraw100)

        const withdrawAmount = initialBalance

        // Expect that bobby can't withdraw >100% of initial balance
        await expect(advisorRewardsBobby.withdraw(withdrawAmount.add(1)))
            .to.be.revertedWith("AmountExceedsMax")

        // Bobby withdraws 100% of reward
        await advisorRewardsBobby.withdraw(withdrawAmount)
    
        // Expect that bobby's account +amount and contract balance -amount
        expect(await helixToken.balanceOf(bobby.address)).to.eq(prevBalanceBobby.add(withdrawAmount))
        expect(await advisorRewards.helixTokenBalance()).to.eq(prevBalanceContract.sub(withdrawAmount))

        // Bobby shouldn't be able to withdraw any more
        await expect(advisorRewardsBobby.withdraw(1))
            .to.be.revertedWith("AmountExceedsMax")
    })

    it('advisorRewards: emergency withdraw all tokens', async () => {
        const helixTokenBalance = await advisorRewards.helixTokenBalance()
        const expectedOwnerBalance = (await helixToken.balanceOf(alice.address)).add(helixTokenBalance)
       
        await advisorRewards.emergencyWithdraw()

        expect(await helixToken.balanceOf(advisorRewards.address)).to.eq(0)
        expect(await helixToken.balanceOf(alice.address)).to.eq(expectedOwnerBalance)
    })

    it("advisorRewards: emergency withdraw when not owner fails", async () => {
        expect(await advisorRewards.owner()).to.not.eq(carol.address)

        await expect(advisorRewardsCarol.emergencyWithdraw())
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    function print(str) {
        if (verbose) console.log(str)
    }
})
