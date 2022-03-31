import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import PublicPresale from '../build/contracts/PublicPresale.json'
import TestToken from '../build/contracts/TestToken.json'
import HelixToken from '../build/contracts/HelixToken.json'

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

const inputRate = initials.PUBLIC_PRESALE_INPUT_RATE[env.network]
const outputRate = initials.PUBLIC_PRESALE_OUTPUT_RATE[env.network]
const initialBalance = initials.PUBLIC_PRESALE_INITIAL_BALANCE[env.network]

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const SECONDS_PER_DAY = 86400
const wallet1InitialBalance = 1000

const verbose = true

describe('Public Presale', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [wallet0, wallet1, wallet2] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    let publicPresale: Contract
    let tokenA: Contract        // input token: a stand-in for BUSD 
    let tokenB: Contract        // used for miscellaneous token checks
    let helixToken: Contract    // output token

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let publicPresale1: Contract
    let tokenA1: Contract
    let helixToken1: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        publicPresale = fullExchange.publicPresale
        tokenA = fullExchange.tokenA
        tokenB = fullExchange.tokenB
        helixToken = fullExchange.helixToken

        // Fund presale with reward tokens
        await helixToken.transfer(publicPresale.address, expandTo18Decimals(initialBalance))

        // Fund user with input token so they can make urchases
        await tokenA.transfer(wallet1.address, expandTo18Decimals(wallet1InitialBalance))

        // Pre-approve the presale to spend caller's funds
        await helixToken.approve(publicPresale.address, MaxUint256)
    
        // create the wallet 1 owned contracts
        publicPresale1 = new Contract(publicPresale.address, JSON.stringify(PublicPresale.abi), provider).connect(wallet1)   
        tokenA1 = new Contract(tokenA.address, JSON.stringify(TestToken.abi), provider).connect(wallet1)   
        helixToken1 = new Contract(helixToken.address, JSON.stringify(HelixToken.abi), provider).connect(wallet1)   
    })

    it('publicPresale: initialized with expected values', async () => {
        expect(await publicPresale.inputToken()).to.eq(tokenA.address)
        expect(await publicPresale.outputToken()).to.eq(helixToken.address)
        expect(await publicPresale.treasury()).to.eq(wallet0.address)
        expect(await publicPresale.INPUT_RATE()).to.eq(inputRate)
        expect(await publicPresale.OUTPUT_RATE()).to.eq(outputRate)
        expect(await helixToken.balanceOf(publicPresale.address))
            .to.eq(expandTo18Decimals(initialBalance))
    })

    it('publicPresale: get owners', async () => {
       const owners = await publicPresale.getOwners()
       expect(owners.length).to.eq(1)
       expect(owners[0]).to.eq(wallet0.address)
    })

    it('publicPresale: add owner', async () => {
        expect(await publicPresale.isOwner(wallet1.address)).to.be.false
        await publicPresale.addOwner(wallet1.address)
        expect(await publicPresale.isOwner(wallet1.address)).to.be.true

        const owners = await publicPresale.getOwners()
        expect(owners.length).to.eq(2)
        expect(owners[1]).to.eq(wallet1.address)
    })

    it('publicPresale: whitelist add', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]
        
        await publicPresale.whitelistAdd(users, maxTickets)

        // users should be whitelisted
        expect(await publicPresale.whitelist(wallet1.address)).to.be.true
        expect(await publicPresale.whitelist(wallet2.address)).to.be.true

        // users should have max tickets set
        expect((await publicPresale.users(wallet1.address)).maxTicket).to.eq(wallet1MaxTicket)
        expect((await publicPresale.users(wallet2.address)).maxTicket).to.eq(wallet2MaxTicket)

        // presale reserved tickets should be incremented
        expect(await publicPresale.ticketsReserved()).to.eq(wallet1MaxTicket + wallet2MaxTicket)
    })

    it('publicPresale: whitelist remove', async () => {
        // first add users
        const users = [wallet1.address, wallet2.address]
        const wallet1MaxTicket = 50
        const wallet2MaxTicket = 100
        const maxTickets = [wallet1MaxTicket, wallet2MaxTicket]
        await publicPresale.whitelistAdd(users, maxTickets)

        // remove wallet 1
        await publicPresale.whitelistRemove(wallet1.address)
        expect(await publicPresale.whitelist(wallet1.address)).to.be.false
        // make sure that wallet 2 isn't removed too
        expect(await publicPresale.whitelist(wallet2.address)).to.be.true

        // remove wallet 2
        await publicPresale.whitelistRemove(wallet2.address)
        expect(await publicPresale.whitelist(wallet1.address)).to.be.false
        expect(await publicPresale.whitelist(wallet2.address)).to.be.false
    })

    it('publicPresale: get amount out', async () => {  
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
        expect(await publicPresale.getAmountOut(amountIn0, inputToken)).to.eq(expectedInputTokenOutAmountIn0)
        expect(await publicPresale.getAmountOut(amountIn1, inputToken)).to.eq(expectedInputTokenOutAmountIn1)

        // check output token
        expect(await publicPresale.getAmountOut(amountIn0, outputToken)).to.eq(expectedOutputTokenOutAmountIn0)
        expect(await publicPresale.getAmountOut(amountIn1, outputToken)).to.eq(expectedOutputTokenOutAmountIn1)

        // check unrecognized token
        expect(await publicPresale.getAmountOut(amountIn0, unrecognizedToken)).to.eq(expectedUnrecognizedTokenOutAmountIn0)
        expect(await publicPresale.getAmountOut(amountIn1, unrecognizedToken)).to.eq(expectedUnrecognizedTokenOutAmountIn1)
    })

    it('publicPresale: pause', async () => {
        await publicPresale.pause()
        expect(await publicPresale.isPaused()).to.be.true
    })

    it('publicPresale: unpause', async () => {
        await publicPresale.pause()
        await publicPresale.unpause()
        expect(await publicPresale.isPaused()).to.be.false
    })

    it('publicPresale: set purchase phase', async () => {
        await publicPresale.setPurchasePhase(0);
        expect(await publicPresale.purchasePhase()).to.eq(0)

        await publicPresale.setPurchasePhase(1);
        expect(await publicPresale.purchasePhase()).to.eq(1)

        await publicPresale.setPurchasePhase(2);
        expect(await publicPresale.purchasePhase()).to.eq(2)
    })

    it('publicPresale: set withdraw phase', async () => {
        await publicPresale.setWithdrawPhase(0);
        expect(await publicPresale.withdrawPhase()).to.eq(0)

        await publicPresale.setWithdrawPhase(1);
        expect(await publicPresale.withdrawPhase()).to.eq(1)

        await publicPresale.setWithdrawPhase(2);
        expect(await publicPresale.withdrawPhase()).to.eq(2)

        await publicPresale.setWithdrawPhase(3);
        expect(await publicPresale.withdrawPhase()).to.eq(3)

        await publicPresale.setWithdrawPhase(4);
        expect(await publicPresale.withdrawPhase()).to.eq(4)

        await publicPresale.setWithdrawPhase(5);
        expect(await publicPresale.withdrawPhase()).to.eq(5)
    })

    it('publicPresale: max removable by owner when unpaused', async () => {
        const owner = wallet0.address
        await publicPresale.unpause()
        const expectedAmount = 0
        expect(await publicPresale.maxRemovable(owner)).to.eq(expectedAmount)
    })

    it('publicPresale: max removable by owner when paused', async () => {
        const owner = wallet0.address
        await publicPresale.pause()
        const expectedAmount = await publicPresale.ticketsAvailable()
        expect(await publicPresale.maxRemovable(owner)).to.eq(expectedAmount)
    })

    it('publicPresale: max removable by user when paused', async () => {
        const user = wallet1.address
        await publicPresale.pause()
        const expectedAmount = 0
        expect(await publicPresale.maxRemovable(user)).to.eq(expectedAmount)
    })

    it('publicPresale: purchase in phase 1', async () => {
        const inputToken = tokenA.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const amount = 100                      // number of tickets purchased by user
        const purchasePhase = 1

        // use to check the updated ticket balance after purchase
        const prevTicketBalance = await publicPresale.ticketsAvailable()

        // expected ticket balance after purchase
        const expectedTicketsAvailable = prevTicketBalance - amount

        // use to check updated balance after purchase
        const prevInputTokenBalance = await tokenA.balanceOf(user)
    
        // expected input token balance after purchase
        const expectedInputTokenBalance = prevInputTokenBalance.sub(expandTo18Decimals(amount * inputRate))

        await publicPresale.whitelistAdd([user], [maxTicket])

        await publicPresale.setPurchasePhase(purchasePhase)

        // get the expected cost in tokens to buy that many tickets
        const tokenAmount = await publicPresale.getAmountOut(amount, inputToken)

        // and have wallet1 pre-approve spending that token amount
        await tokenA1.approve(publicPresale.address, tokenAmount)

        // have wallet1  purchase their max ticket allotment
        await publicPresale1.purchase(amount)

        // expect wallet1 balance of input to decrease by the tokenAmount
        expect(await tokenA.balanceOf(user)).to.eq(expectedInputTokenBalance)

        // expect user's tickets purchased and balance to increase by amount
        // note, this is the user's first purchase so 0 + amount == amount
        expect((await publicPresale.users(user)).purchased).to.eq(amount)
        expect((await publicPresale.users(user)).balance).to.eq(amount)

        // and expect the total tickes available in the contract to have decreased by amount
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketsAvailable)
    })

    it('publicPresale: purchase in phase 2', async () => {
        // only difference from purchase in phase 1 is we set to phase 2 and 
        // user successfully purchases more than their whitelisted allotment 

        const inputToken = tokenA.address 
        const user = wallet1.address            // account to whitelist
        const maxTicket = 100                   // allotment to whitelisted user
        const amount = 200                      // number of tickets purchased by user
        const purchasePhase = 2

        // use to check the updated ticket balance after purchase
        const prevTicketBalance = await publicPresale.ticketsAvailable()

        // expected ticket balance after purchase
        const expectedTicketsAvailable = prevTicketBalance - amount

        // use to check updated balance after purchase
        const prevInputTokenBalance = await tokenA.balanceOf(user)
    
        // expected input token balance after purchase
        const expectedInputTokenBalance = prevInputTokenBalance.sub(expandTo18Decimals(amount * inputRate))

        await publicPresale.whitelistAdd([user], [maxTicket])

        await publicPresale.setPurchasePhase(purchasePhase)

        // get the expected cost in tokens to buy that many tickets
        const tokenAmount = await publicPresale.getAmountOut(amount, inputToken)

        // and have wallet1 pre-approve spending that token amount
        await tokenA1.approve(publicPresale.address, tokenAmount)

        // have wallet1  purchase their max ticket allotment
        await publicPresale1.purchase(amount)

        // expect wallet1 balance of input to decrease by the tokenAmount
        expect(await tokenA.balanceOf(user)).to.eq(expectedInputTokenBalance)

        // expect user's tickets purchased and balance to increase by amount
        // note, this is the user's first purchase so 0 + amount == amount
        expect((await publicPresale.users(user)).purchased).to.eq(amount)
        expect((await publicPresale.users(user)).balance).to.eq(amount)

        // and expect the total tickes available in the contract to have decreased by amount
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketsAvailable)
    })

    it('publicPresale: withdraw 25% of purchase in phase 2', async () => {
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
        const expectedOutputTokenDifference = await publicPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(publicPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await publicPresale.whitelistAdd([user], [maxTicket])
        await publicPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await publicPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(publicPresale.address, tokenAmount)

        await publicPresale1.purchase(purchaseAmount)

        // now make a withdrawal

        // first set the correct phase
        await publicPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await publicPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await publicPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await publicPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('publicPresale: withdraw 50% of purchase in phase 3', async () => {
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
        const expectedOutputTokenDifference = await publicPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(publicPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await publicPresale.whitelistAdd([user], [maxTicket])
        await publicPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await publicPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(publicPresale.address, tokenAmount)

        await publicPresale1.purchase(purchaseAmount)

        // make a withdrawal

        // first set the correct phase
        await publicPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await publicPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await publicPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await publicPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('publicPresale: withdraw 75% of purchase in phase 4', async () => {
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
        const expectedOutputTokenDifference = await publicPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(publicPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await publicPresale.whitelistAdd([user], [maxTicket])
        await publicPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await publicPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(publicPresale.address, tokenAmount)

        await publicPresale1.purchase(purchaseAmount)

        // make a withdrawal

        // first set the correct phase
        await publicPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await publicPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await publicPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await publicPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('publicPresale: withdraw 100% of purchase in phase 5', async () => {
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
        const expectedOutputTokenDifference = await publicPresale.getAmountOut(withdrawAmount, outputToken)

        // expect the user's token balance to increase in outputTokens 
        const expectedUserTokenBalance = (await helixToken.balanceOf(user)).add(expectedOutputTokenDifference)

        // and expect the contract's outputToken balance to decrease by the same amount
        const expectedPresaleTokenBalance = (await helixToken.balanceOf(publicPresale.address)).sub(expectedOutputTokenDifference)

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(purchaseAmount * withdrawPercent)

        // make a purchase

        await publicPresale.whitelistAdd([user], [maxTicket])
        await publicPresale.setPurchasePhase(purchasePhase)

        const tokenAmount = await publicPresale.getAmountOut(purchaseAmount, inputToken)
        await tokenA1.approve(publicPresale.address, tokenAmount)

        await publicPresale1.purchase(purchaseAmount)

        // make a withdrawal

        // first set the correct phase
        await publicPresale.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await publicPresale1.withdraw(withdrawAmount)

        // check that the updated amounts match the expectations
        expect((await publicPresale.users(user)).purchased).to.eq(expectedUserTicketPurchased)
        expect((await publicPresale.users(user)).balance).to.eq(expectedUserTicketBalance)
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserTokenBalance)
        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedPresaleTokenBalance)
    })

    it('publicPresale: burn all tickets while paused as owner', async () => {
        const owner = wallet0.address

        const expectedTokenBalance = 0
        const expectedTicketBalance = 0
       
        // Must be paused to burn
        await publicPresale.pause()

        // Remove all tokens and tickets
        const maxTicket = await publicPresale.maxRemovable(owner)
        await publicPresale.burn(maxTicket)

        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedTokenBalance)
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketBalance)
    })

    it('publicPresale: withdraw all tickets while paused as owner', async () => {
        // Must be paused to withdraw as owner
        // must pause before getting maxTokens or else maxTokens == 0
        await publicPresale.pause()

        const owner = wallet0.address
        const outputToken = helixToken.address
        const maxTicket = await publicPresale.maxRemovable(owner)
        const maxTokens = await publicPresale.getAmountOut(maxTicket, outputToken)

        const expectedOwnerTokenBalance = (await helixToken.balanceOf(owner)).add(maxTokens)
        const expectedPresaleTokenBalance = 0
        const expectedTicketBalance = 0
       
        // Remove all tokens and tickets
        await publicPresale.withdraw(maxTicket)

        expect(await helixToken.balanceOf(owner)).to.eq(expectedOwnerTokenBalance)
        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedPresaleTokenBalance)
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketBalance)
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
