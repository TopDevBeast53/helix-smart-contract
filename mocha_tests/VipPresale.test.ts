import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import VipPresale from '../build/contracts/VipPresale.json'
import TestToken from '../build/contracts/TestToken.json'
import HelixToken from '../build/contracts/HelixToken.json'

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

const inputRate = initials.VIP_PRESALE_INPUT_RATE[env.network]
const outputRate = initials.VIP_PRESALE_OUTPUT_RATE[env.network]
const initialBalance = initials.VIP_PRESALE_INITIAL_BALANCE[env.network]

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const SECONDS_PER_DAY = 86400
const wallet1InitialBalance = 1000

const verbose = true

describe('VIP Presale', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [wallet0, wallet1, wallet2] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    let vipPresale: Contract
    let tokenA: Contract        // input token: a stand-in for BUSD 
    let tokenB: Contract        // used for miscellaneous token checks
    let helixToken: Contract    // output token

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let vipPresale1: Contract
    let tokenA1: Contract
    let helixToken1: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        vipPresale = fullExchange.vipPresale
        tokenA = fullExchange.tokenA
        tokenB = fullExchange.tokenB
        helixToken = fullExchange.helixToken

        // Fund presale with reward tokens
        await helixToken.transfer(vipPresale.address, expandTo18Decimals(initialBalance))

        // Fund user with input token so they can make urchases
        await tokenA.transfer(wallet1.address, expandTo18Decimals(wallet1InitialBalance))

        // Pre-approve the presale to spend caller's funds
        await helixToken.approve(vipPresale.address, MaxUint256)
    
        // create the wallet 1 owned contracts
        vipPresale1 = new Contract(vipPresale.address, JSON.stringify(VipPresale.abi), provider).connect(wallet1)   
        tokenA1 = new Contract(tokenA.address, JSON.stringify(TestToken.abi), provider).connect(wallet1)   
        helixToken1 = new Contract(helixToken.address, JSON.stringify(HelixToken.abi), provider).connect(wallet1)   
    })

    it('vipPresale: initialized with expected values', async () => {
        expect(await vipPresale.inputToken()).to.eq(tokenA.address)
        expect(await vipPresale.outputToken()).to.eq(helixToken.address)
        expect(await vipPresale.treasury()).to.eq(wallet0.address)
        expect(await vipPresale.INPUT_RATE()).to.eq(inputRate)
        expect(await vipPresale.OUTPUT_RATE()).to.eq(outputRate)
        expect(await helixToken.balanceOf(vipPresale.address))
            .to.eq(expandTo18Decimals(initialBalance))
    })

    it('vipPresale: get owners', async () => {
       const owners = await vipPresale.getOwners()
       expect(owners.length).to.eq(1)
       expect(owners[0]).to.eq(wallet0.address)
    })

    it('vipPresale: add owner', async () => {
        expect(await vipPresale.isOwner(wallet1.address)).to.be.false
        await vipPresale.addOwner(wallet1.address)
        expect(await vipPresale.isOwner(wallet1.address)).to.be.true

        const owners = await vipPresale.getOwners()
        expect(owners.length).to.eq(2)
        expect(owners[1]).to.eq(wallet1.address)
    })

    it('vipPresale: add owner with invalid address fails', async () => {
        const invalidAddress = constants.AddressZero
        await expect(vipPresale.addOwner(invalidAddress))
            .to.be.revertedWith("VipPresale: INVALID ADDRESS")
    })

    it('vipPresale: add owner as non-owner fails', async () => {
        // we call the contract as wallet1, a non-owner
        await expect(vipPresale1.addOwner(wallet2.address))
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: add owner as duplicate fails', async () => {
        const preexistingOwner = wallet0.address 
        // wallet 0 is already an owner by default because they were the contract creator
        await expect(vipPresale.addOwner(preexistingOwner))
            .to.be.revertedWith("VipPresale: ALREADY AN OWNER")
    })

    it('vipPresale: whitelist add', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]
        
        await vipPresale.whitelistAdd(users, maxTickets)

        // users should be whitelisted
        expect(await vipPresale.whitelist(wallet1.address)).to.be.true
        expect(await vipPresale.whitelist(wallet2.address)).to.be.true

        // users should have max tickets set
        expect((await vipPresale.users(wallet1.address)).maxTicket).to.eq(wallet1MaxTicket)
        expect((await vipPresale.users(wallet2.address)).maxTicket).to.eq(wallet2MaxTicket)

        // presale reserved tickets should be incremented
        expect(await vipPresale.ticketsReserved()).to.eq(wallet1MaxTicket + wallet2MaxTicket)
    })

    it('vipPresale: whitelist add as non-owner fails', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]

        // we call the contract as wallet1, a non-owner
        await expect(vipPresale1.whitelistAdd(users, maxTickets))
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: whitelist add with unequal argument arrays fails', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const maxTickets = [wallet1MaxTicket]

        await expect(vipPresale.whitelistAdd(users, maxTickets))
            .to.be.revertedWith("VipPresale: USERS AND MAX TICKETS MUST HAVE SAME LENGTH")
    })

    it('vipPresale: whitelist add with invalid user address fails', async () => {
        const invalidUser1Address = constants.AddressZero
        const users = [invalidUser1Address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]

        await expect(vipPresale.whitelistAdd(users, maxTickets))
            .to.be.revertedWith("VipPresale: INVALID ADDRESS")
    })

    it('vipPresale: whitelist add with too large user max ticket fails', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = MaxUint256
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]

        await expect(vipPresale.whitelistAdd(users, maxTickets))
            .to.be.revertedWith("VipPresale: MAX TICKET CAN'T BE GREATER THAN TICKETS AVAILABLE")
    })

    it('vipPresale: whitelist add with duplicate user fails', async () => {
        // note that both addresses are the same
        const users = [wallet1.address, wallet1.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]

        await expect(vipPresale.whitelistAdd(users, maxTickets))
            .to.be.revertedWith("VipPresale: USER IS ALREADY WHITELISTED")
    })

    it('vipPresale: whitelist set max ticket as non-owner fails', async () => {
        // wallet 1 is not an owner
        await expect(vipPresale1.whitelistSetMaxTicket(wallet1.address, 100))
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: whitelist set max ticket without whitelist user first fails', async () => {
        await expect(vipPresale.whitelistSetMaxTicket(wallet1.address, 100))
            .to.be.revertedWith("VipPresale: USER ISN'T WHITELISTED")
    })

    it('vipPresale: whitelist set max ticket', async () => {
        // first do an add
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]
        
        await vipPresale.whitelistAdd(users, maxTickets)

        // users should be whitelisted
        expect(await vipPresale.whitelist(wallet1.address)).to.be.true
        expect(await vipPresale.whitelist(wallet2.address)).to.be.true

        // users should have max tickets set
        expect((await vipPresale.users(wallet1.address)).maxTicket).to.eq(wallet1MaxTicket)
        expect((await vipPresale.users(wallet2.address)).maxTicket).to.eq(wallet2MaxTicket)

        // presale reserved tickets should be incremented
        expect(await vipPresale.ticketsReserved()).to.eq(wallet1MaxTicket + wallet2MaxTicket)

        // now update wallet 1 max ticket
        const newWallet1MaxTicket = 100
        await vipPresale.whitelistSetMaxTicket(wallet1.address, newWallet1MaxTicket)
    
        // check that the amount of tickets reserved is correctly updated
        let expectedTicketsReserved = newWallet1MaxTicket + wallet2MaxTicket
        expect(await vipPresale.ticketsReserved()).to.eq(expectedTicketsReserved)

        // check that wallet 1 max ticket amount is updated
        expect((await vipPresale.users(wallet1.address)).maxTicket).to.eq(newWallet1MaxTicket)

        // now update wallet 2 max ticket
        const newWallet2MaxTicket = 50
        await vipPresale.whitelistSetMaxTicket(wallet2.address, newWallet2MaxTicket)
    
        // check that the amount of tickets reserved is correctly updated
        expectedTicketsReserved = newWallet1MaxTicket + newWallet2MaxTicket
        expect(await vipPresale.ticketsReserved()).to.eq(expectedTicketsReserved)

        // check that wallet 2 max ticket amount is updated
        expect((await vipPresale.users(wallet2.address)).maxTicket).to.eq(newWallet2MaxTicket)
    })

    it('vipPresale: whitelist remove', async () => {
        // first add users
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]
        await vipPresale.whitelistAdd(users, maxTickets)

        // remove wallet 1
        await vipPresale.whitelistRemove(wallet1.address)
        expect(await vipPresale.whitelist(wallet1.address)).to.be.false
        // make sure that wallet 2 isn't removed too
        expect(await vipPresale.whitelist(wallet2.address)).to.be.true

        // remove wallet 2
        await vipPresale.whitelistRemove(wallet2.address)
        expect(await vipPresale.whitelist(wallet1.address)).to.be.false
        expect(await vipPresale.whitelist(wallet2.address)).to.be.false
    })

    it('vipPresale: whitelist remove as non-owner fails', async () => {
        // first add users
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]
        await vipPresale.whitelistAdd(users, maxTickets)

        // calling as wallet1
        await expect(vipPresale1.whitelistRemove(wallet2.address))
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: get amount out', async () => {  
        // represents the number of tickets to exchange for tokens
        const amountIn0 = 0
        const amountIn1 = 1

        const inputToken = tokenA.address
        const outputToken = helixToken.address
        const unrecognizedToken = tokenB.address

        const expectedInputTokenOutAmountIn0 = 0
        const expectedOutputTokenOutAmountIn0 = 0
        const expectedUnrecognizedTokenOutAmountIn0 = 0

        const expectedInputTokenOutAmountIn1 = expandTo18Decimals(5)
        const expectedOutputTokenOutAmountIn1 = expandTo18Decimals(400)
        const expectedUnrecognizedTokenOutAmountIn1 = 0
    
        // get amount out returns the number of tokens per ticket

        // check input token
        expect(await vipPresale.getAmountOut(amountIn0, inputToken)).to.eq(expectedInputTokenOutAmountIn0)
        expect(await vipPresale.getAmountOut(amountIn1, inputToken)).to.eq(expectedInputTokenOutAmountIn1)

        // check output token
        expect(await vipPresale.getAmountOut(amountIn0, outputToken)).to.eq(expectedOutputTokenOutAmountIn0)
        expect(await vipPresale.getAmountOut(amountIn1, outputToken)).to.eq(expectedOutputTokenOutAmountIn1)

        // check unrecognized token
        expect(await vipPresale.getAmountOut(amountIn0, unrecognizedToken)).to.eq(expectedUnrecognizedTokenOutAmountIn0)
        expect(await vipPresale.getAmountOut(amountIn1, unrecognizedToken)).to.eq(expectedUnrecognizedTokenOutAmountIn1)
    })

    it('vipPresale: pause', async () => {
        await vipPresale.pause()
        expect(await vipPresale.isPaused()).to.be.true
    })

    it('vipPresale: pause as non-owner fails', async () => {
        await expect(vipPresale1.pause())
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: unpause', async () => {
        await vipPresale.pause()
        await vipPresale.unpause()
        expect(await vipPresale.isPaused()).to.be.false
    })

    it('vipPresale: uppause as non-owner fails', async () => {
        await vipPresale.pause()
        await expect(vipPresale1.unpause())
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: set purchase phase', async () => {
        await vipPresale.setPurchasePhase(0);
        expect(await vipPresale.purchasePhase()).to.eq(0)

        await vipPresale.setPurchasePhase(1);
        expect(await vipPresale.purchasePhase()).to.eq(1)

        await vipPresale.setPurchasePhase(2);
        expect(await vipPresale.purchasePhase()).to.eq(2)

        await vipPresale.setPurchasePhase(3);
        expect(await vipPresale.purchasePhase()).to.eq(3)
    })

    it('vipPresale: set purchase phase as non-owner fails', async () => {
        // wallet 1 is not an owner
        await expect(vipPresale1.setPurchasePhase(0))
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: set purchase phase with invalid phase fails', async () => {
        const invalidPhase = (await vipPresale.PURCHASE_PHASE_END()).toNumber() + 1
        await expect(vipPresale.setPurchasePhase(invalidPhase))
            .to.be.revertedWith("VipPresale: PHASE EXCEEDS PURCHASE PHASE END")
    })

    it('vipPresale: set purchase phase emits set purchase phase event', async () => {
        const phase = 0
        const phaseDuration = (await vipPresale.PURCHASE_PHASE_DURATION()).toNumber()
        await expect(vipPresale.setPurchasePhase(phase))
            .to.emit(vipPresale, "SetPurchasePhase")
            .withArgs(
               phase,
               Math.trunc(Date.now() / 1000),
               Math.trunc(Date.now() / 1000) + phaseDuration
            )
    })

    it('vipPresale: set withdraw phase', async () => {
        await vipPresale.setWithdrawPhase(0);
        expect(await vipPresale.withdrawPhase()).to.eq(0)

        await vipPresale.setWithdrawPhase(1);
        expect(await vipPresale.withdrawPhase()).to.eq(1)

        await vipPresale.setWithdrawPhase(2);
        expect(await vipPresale.withdrawPhase()).to.eq(2)

        await vipPresale.setWithdrawPhase(3);
        expect(await vipPresale.withdrawPhase()).to.eq(3)

        await vipPresale.setWithdrawPhase(4);
        expect(await vipPresale.withdrawPhase()).to.eq(4)

        await vipPresale.setWithdrawPhase(5);
        expect(await vipPresale.withdrawPhase()).to.eq(5)
    })

    it('vipPresale: set withdraw phase as non-owner fails', async () => {
        // wallet 1 is not an owner
        await expect(vipPresale1.setWithdrawPhase(0))
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: set withdraw phase with invalid phase fails', async () => {
        const invalidPhase = (await vipPresale.WITHDRAW_PHASE_END()).toNumber() + 1
        await expect(vipPresale.setWithdrawPhase(invalidPhase))
            .to.be.revertedWith("VipPresale: PHASE EXCEEDS WITHDRAW PHASE END")
    })

    it('vipPresale: set withdraw phase emits set withdraw phase event', async () => {
        const phase = 0
        const phaseDuration = (await vipPresale.WITHDRAW_PHASE_DURATION()).toNumber()
        await expect(vipPresale.setWithdrawPhase(phase))
            .to.emit(vipPresale, "SetWithdrawPhase")
            .withArgs(
               phase,
               Math.trunc(Date.now() / 1000),
               Math.trunc(Date.now() / 1000) + phaseDuration
            )
    })

    it('vipPresale: max removable by owner when unpaused', async () => {
        const owner = wallet0.address
        await vipPresale.unpause()
        const expectedAmount = 0
        expect(await vipPresale.maxRemovable(owner)).to.eq(expectedAmount)
    })

    it('vipPresale: max removable by owner when paused', async () => {
        const owner = wallet0.address
        await vipPresale.pause()
        const expectedAmount = await vipPresale.ticketsAvailable()
        expect(await vipPresale.maxRemovable(owner)).to.eq(expectedAmount)
    })

    it('vipPresale: max removable by user when unpaused', async () => {
        const user = wallet1.address
        const maxTicket = 50
        
        // user must be whitelisted
        const users = [user]
        const maxTickets = [maxTicket]
        await vipPresale.whitelistAdd(users, maxTickets)

        // must be in purchase phase
        const purchasePhase = 2
        await vipPresale.setPurchasePhase(purchasePhase)

        // user must give presale permission to transfer tokens 
        await tokenA1.approve(vipPresale.address, MaxUint256)

        // user must purchase tickets
        // purchase as wallet 1
        await vipPresale1.purchase(maxTicket)

        // must be in withdraw phase
        const withdrawPhase = 5
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // guarantee that the contract is unpaused
        await vipPresale.unpause()

        // confirm max is the same as balance before withdrawal
        const expectedAmountBeforeWithdrawal = 50
        expect(await vipPresale.maxRemovable(user)).to.eq(expectedAmountBeforeWithdrawal)

        // withdraw half of the users tokens
        await vipPresale1.withdraw(20)

        // confirm that max is reduced after withdrawal
        const expectedAmountAfterWithdrawal = 30
        expect(await vipPresale.maxRemovable(user)).to.eq(expectedAmountAfterWithdrawal)
    })

    it('vipPresale: max removable by user when paused', async () => {
        const user = wallet1.address
        await vipPresale.pause()
        const expectedAmount = 0
        expect(await vipPresale.maxRemovable(user)).to.eq(expectedAmount)
    })

    it('vipPresale: purchase in phase 1', async () => {
        const inputToken = tokenA.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const amount = 100                      // number of tickets purchased by user
        const purchasePhase = 1

        // use to check the updated ticket balance after purchase
        const prevTicketBalance = await vipPresale.ticketsAvailable()

        // expected ticket balance after purchase
        const expectedTicketsAvailable = prevTicketBalance - amount

        // use to check updated balance after purchase
        const prevInputTokenBalance = await tokenA.balanceOf(user)
    
        // expected input token balance after purchase
        const expectedInputTokenBalance = prevInputTokenBalance.sub(expandTo18Decimals(amount * inputRate))

        await vipPresale.whitelistAdd([user], [maxTicket])

        await vipPresale.setPurchasePhase(purchasePhase)

        // get the expected cost in tokens to buy that many tickets
        const tokenAmount = await vipPresale.getAmountOut(amount, inputToken)

        // and have wallet1 pre-approve spending that token amount
        await tokenA1.approve(vipPresale.address, tokenAmount)

        // have wallet1  purchase their max ticket allotment
        await vipPresale1.purchase(amount)

        // expect wallet1 balance of input to decrease by the tokenAmount
        expect(await tokenA.balanceOf(user)).to.eq(expectedInputTokenBalance)

        // expect user's tickets purchased and balance to increase by amount
        // note, this is the user's first purchase so 0 + amount == amount
        expect((await vipPresale.users(user)).purchased).to.eq(amount)
        expect((await vipPresale.users(user)).balance).to.eq(amount)

        // and expect the total tickes available in the contract to have decreased by amount
        expect(await vipPresale.ticketsAvailable()).to.eq(expectedTicketsAvailable)
    })

    it('vipPresale: purchase in phase 2', async () => {
        // only difference from purchase in phase 1 is we set to phase 2 and 
        // user successfully purchases more than their whitelisted allotment 

        const inputToken = tokenA.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const amount = 200                      // number of tickets purchased by user
        const purchasePhase = 2

        // use to check the updated ticket balance after purchase
        const prevTicketBalance = await vipPresale.ticketsAvailable()

        // expected ticket balance after purchase
        const expectedTicketsAvailable = prevTicketBalance - amount

        // use to check updated balance after purchase
        const prevInputTokenBalance = await tokenA.balanceOf(user)
    
        // expected input token balance after purchase
        const expectedInputTokenBalance = prevInputTokenBalance.sub(expandTo18Decimals(amount * inputRate))

        await vipPresale.whitelistAdd([user], [maxTicket])

        await vipPresale.setPurchasePhase(purchasePhase)

        // get the expected cost in tokens to buy that many tickets
        const tokenAmount = await vipPresale.getAmountOut(amount, inputToken)

        // and have wallet1 pre-approve spending that token amount
        await tokenA1.approve(vipPresale.address, tokenAmount)

        // have wallet1  purchase their max ticket allotment
        await vipPresale1.purchase(amount)

        // expect wallet1 balance of input to decrease by the tokenAmount
        expect(await tokenA.balanceOf(user)).to.eq(expectedInputTokenBalance)

        // expect user's tickets purchased and balance to increase by amount
        // note, this is the user's first purchase so 0 + amount == amount
        expect((await vipPresale.users(user)).purchased).to.eq(amount)
        expect((await vipPresale.users(user)).balance).to.eq(amount)

        // and expect the total tickes available in the contract to have decreased by amount
        expect(await vipPresale.ticketsAvailable()).to.eq(expectedTicketsAvailable)
    })

    it('vipPresale: purchase in phase 3 fails', async () => {
        // purchases in phase 3 should be prohibited

        const inputToken = tokenA.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const amount = 200                      // number of tickets purchased by user
        const purchasePhase = 3

        await vipPresale.whitelistAdd([user], [maxTicket])

        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(amount, inputToken)

        // and have wallet1 pre-approve spending that token amount
        await tokenA1.approve(vipPresale.address, tokenAmount)

        // have wallet1  purchase their max ticket allotment
        await expect(vipPresale1.purchase(amount))
            .to.be.revertedWith("VipPresale: SALE HAS ENDED")
    })

    it('vipPresale: withdraw 0 amount fails in all withdraw phases', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 100              // number of tickets purchased by user
        let withdrawPhase = 1                 // allow up to 25% purchased withdrawal
        const withdrawAmount = 0                // amount withdrawn by user
        const withdrawPercent = 0               // max percent withdrawable in this withdraw phase
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of output tokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // now make a withdrawal

        // try phase 1
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await expect(vipPresale1.withdraw(withdrawAmount))
            .to.be.revertedWith("VipPresale: AMOUNT MUST BE GREATER THAN 0 TO REMOVE")

        // try phase 2
        withdrawPhase = 2
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await expect(vipPresale1.withdraw(withdrawAmount))
            .to.be.revertedWith("VipPresale: AMOUNT MUST BE GREATER THAN 0 TO REMOVE")

        // try phase 3
        withdrawPhase = 3
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await expect(vipPresale1.withdraw(withdrawAmount))
            .to.be.revertedWith("VipPresale: AMOUNT MUST BE GREATER THAN 0 TO REMOVE")

        // try phase 4
        withdrawPhase = 4
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await expect(vipPresale1.withdraw(withdrawAmount))
            .to.be.revertedWith("VipPresale: AMOUNT MUST BE GREATER THAN 0 TO REMOVE")

        // try phase 5
        withdrawPhase = 5
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await expect(vipPresale1.withdraw(withdrawAmount))
            .to.be.revertedWith("VipPresale: AMOUNT MUST BE GREATER THAN 0 TO REMOVE")

    })

    it('vipPresale: withdraw 25% of purchase in phase 2', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 100              // number of tickets purchased by user
        const withdrawPhase = 2                 // allow up to 25% purchased withdrawal
        const withdrawAmount = 25               // amount withdrawn by user
        const withdrawPercent = 0.25            // max percent withdrawable in this withdraw phase
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of output tokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // now make a withdrawal

        // first set the correct phase
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await vipPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await vipPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await vipPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('vipPresale: withdraw more than 25% of purchase in withdraw phase 2 fails', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 100              // number of tickets purchased by user
        const withdrawPhase = 2                 // allow up to 25% purchased withdrawal
        const withdrawAmount = 25               // amount withdrawn by user
        const withdrawPercent = 0.25            // max percent withdrawable in this withdraw phase
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of output tokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // now make a withdrawal

        // first set the correct phase
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await vipPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await vipPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await vipPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)

        // check that the user can't withdraw any more this phase
        expect(await vipPresale.maxRemovable(user)).to.eq(0)

        // try to withdraw again, expect to fail
        await expect(vipPresale1.withdraw(withdrawAmount))
            .to.be.revertedWith("VipPresale: INSUFFICIENT ACCOUNT BALANCE TO REMOVE")
    })

    it('vipPresale: withdraws across multiple phases', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 100              // number of tickets purchased by user
        let withdrawPhase = 2                 // allow up to 25% purchased withdrawal
        let withdrawAmount = 25               // amount withdrawn by user
        let withdrawPercent = 0.25            // max percent withdrawable in this withdraw phase
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of outputtokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // make a withdrawal

        // first set the correct phase
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await vipPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await vipPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await vipPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)

        expect(await vipPresale.maxRemovable(user)).to.eq(0)

        // go to next withdraw phase
        withdrawPhase = 3
        withdrawPercent = 0.25

        await vipPresale.setWithdrawPhase(withdrawPhase)

        // the user should only be able to remove up to 50% in this phase
        // since they removed 25% last phase they have 25% left to withdraw this phase
        expect(await vipPresale.maxRemovable(user)).to.eq(25)

        // and check phase 4
        withdrawPhase = 4
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // they should be able to remove up to 75% of total purchase this phase
        // user didn't withdraw last phase 
        // but did withdraw 25% in first phase
        // leaving 75% - 25% = 50% available to witdraw
        expect(await vipPresale.maxRemovable(user)).to.eq(50)

        // withdraw as user
        withdrawAmount = 50
        await vipPresale1.withdraw(withdrawAmount)

        // they've withdrawn max amount and should not be able to withdraw more this phase
        expect(await vipPresale.maxRemovable(user)).to.eq(0)

        // and check phase 5
        withdrawPhase = 5
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // user has withdrawn 75% of total purchase
        // should have only 25% left to withdraw
        expect(await vipPresale.maxRemovable(user)).to.eq(25)

        // withdraw the remainder as user
        withdrawAmount = 25
        await vipPresale1.withdraw(withdrawAmount)

        // should be nothing left to withdraw
        expect(await vipPresale.maxRemovable(user)).to.eq(0)
    })

    it('vipPresale: withdraw 50% of purchase in phase 3', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 100              // number of tickets purchased by user
        const withdrawPhase = 3                 // allow up to 25% purchased withdrawal
        const withdrawAmount = 50               // amount withdrawn by user
        const withdrawPercent = 0.50            // max percent withdrawable in this withdraw phase
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of outputtokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // make a withdrawal

        // first set the correct phase
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await vipPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await vipPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await vipPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('vipPresale: withdraw 75% of purchase in phase 4', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 100              // number of tickets purchased by user
        const withdrawPhase = 4                 // allow up to 25% purchased withdrawal
        const withdrawAmount = 75               // amount withdrawn by user
        const withdrawPercent = 0.75            // max percent withdrawable in this withdraw phase
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of outputtokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // make a withdrawal

        // first set the correct phase
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await vipPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await vipPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await vipPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('vipPresale: withdraw 100% of purchase in phase 5', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 100              // number of tickets purchased by user
        const withdrawPhase = 5                 // allow up to 25% purchased withdrawal
        const withdrawAmount = 100               // amount withdrawn by user
        const withdrawPercent = 1            // max percent withdrawable in this withdraw phase
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of outputtokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // make a withdrawal

        // first set the correct phase
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await vipPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await vipPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await vipPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('vipPresale: purchase all tickets withdraw 100% of purchase in phase 5', async () => {
        const inputToken = tokenA.address 
        const outputToken = helixToken.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 50000                   // allotment to whitelisted user
        const purchasePhase = 1                 // allow up to maxTicket purchase
        const purchaseAmount = 50000              // number of tickets purchased by user
        const withdrawPhase = 5                 // allow up to 25% purchased withdrawal
        const withdrawAmount = 50000               // amount withdrawn by user
        const withdrawPercent = 1            // max percent withdrawable in this withdraw phase

        // transfer enough tokens to wallet1 to make the purchase
        await tokenA.transfer(wallet1.address, expandTo18Decimals(maxTicket * 5))
    
        // expect the number of tickets a user has purchased to stay the same after withdrawals
        const expectedUserTicketPurchased = purchaseAmount;

        // expect the user's ticket balance to decrease after withdrawls
        const expectedUserTicketBalance = purchaseAmount - withdrawAmount;
  
        // the number of outputtokens we expect the user to have withdrawn
        const expectedOutputTokenDifference = await vipPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(vipPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await vipPresale.whitelistAdd([user], [maxTicket])
        await vipPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await vipPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(vipPresale.address, tokenAmount)

        await vipPresale1.purchase(purchaseAmount)

        // check that all the tickets are purchased
        expect(await vipPresale.ticketsAvailable()).to.eq(0)

        // make a withdrawal

        // first set the correct phase
        await vipPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await vipPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await vipPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await vipPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(0)
    })


    it('vipPresale: burn all tickets while paused as owner', async () => {
        const owner = wallet0.address

        const expectedTokenBalance = 0
        const expectedTicketBalance = 0
       
        // Must be paused to burn
        await vipPresale.pause()

        // Remove all tokens and tickets
        const maxTicket = await vipPresale.maxRemovable(owner)
        await vipPresale.burn(maxTicket)

        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedTokenBalance)
        expect(await vipPresale.ticketsAvailable()).to.eq(expectedTicketBalance)
    })

    it('vipPresale: burn called by non-owner fails', async () => {
        // wallet 1 is a non-owner
        await expect(vipPresale1.burn(0))
            .to.be.revertedWith("VipPresale: CALLER IS NOT OWNER")
    })

    it('vipPresale: withdraw all tickets while paused as owner', async () => {
        // Must be paused to withdraw as owner
        // must pause before getting maxTokens or else maxTokens == 0
        await vipPresale.pause()

        const owner = wallet0.address
        const outputToken = helixToken.address
        const maxTicket = await vipPresale.maxRemovable(owner)
        const maxTokens = await vipPresale.getAmountOut(maxTicket, outputToken)

        const expectedOwnerTokenBalance = (await helixToken.balanceOf(owner)).add(maxTokens)
        const expectedPresaleTokenBalance = 0
        const expectedTicketBalance = 0
       
        // Remove all tokens and tickets
        await vipPresale.withdraw(maxTicket)

        expect(await helixToken.balanceOf(owner)).to.eq(expectedOwnerTokenBalance)
        expect(await helixToken.balanceOf(vipPresale.address)).to.eq(expectedPresaleTokenBalance)
        expect(await vipPresale.ticketsAvailable()).to.eq(expectedTicketBalance)
    })
    
    function print(str: string) {
        if (verbose) console.log(str)
    }
})
