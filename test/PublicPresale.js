const { expect } = require("chai")                                                                   
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify } = require("legacy-ethers/utils")                                
const { expandTo18Decimals } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

const addresses = require('../scripts/constants/addresses')
const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

const treasuryAddress = addresses.TREASURY[env.testNetwork]
const inputRate = initials.PUBLIC_PRESALE_INPUT_RATE[env.testNetwork]
const outputRate = initials.PUBLIC_PRESALE_OUTPUT_RATE[env.testNetwork]
const initialBalance = initials.PUBLIC_PRESALE_INITIAL_BALANCE[env.testNetwork]

const SECONDS_PER_DAY = 86400
const wallet1InitialBalance = 10000

describe('Public Presale', () => {
    let wallet0, wallet1, wallet2

    let publicPresale
    let tokenA        // input token: a stand-in for BUSD 
    let tokenB        // used for miscellaneous token checks
    let helixToken    // output token

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let publicPresale1
    let tokenA1
    let helixToken1

    beforeEach(async () => {
        [wallet0, wallet1, wallet2] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        publicPresale = fullExchange.publicPresale
        tokenA = fullExchange.tokenA
        tokenB = fullExchange.tokenB
        helixToken = fullExchange.helixToken

        // Make self a helix token minter and mint to public presale initial balance
        await helixToken.addMinter(wallet0.address)
        await helixToken.mint(publicPresale.address, expandTo18Decimals(initialBalance))

        // Fund user with input token so they can make purchases
        await tokenA.transfer(wallet1.address, expandTo18Decimals(wallet1InitialBalance))

        // Pre-approve the presale to spend caller's funds
        await helixToken.approve(publicPresale.address, expandTo18Decimals(1000000))

        // create the wallet 1 owned contracts
        const publicPresaleContractFactory = await ethers.getContractFactory("PublicPresale") 
        publicPresale1 = publicPresaleContractFactory.attach(publicPresale.address)
            .connect(wallet1)

        const testTokenContractFactory = await ethers.getContractFactory("TestToken")
        tokenA1 = testTokenContractFactory.attach(tokenA.address).connect(wallet1)

        const helixTokenContractFactory = await ethers.getContractFactory("HelixToken")
        helixToken1 = helixTokenContractFactory.attach(helixToken.address).connect(wallet1)
    })

    /*
    it('publicPresale: initialized with expected values', async () => {
        expect(await publicPresale.inputToken()).to.eq(tokenA.address)
        expect(await publicPresale.outputToken()).to.eq(helixToken.address)
        expect(await publicPresale.treasury()).to.eq(treasuryAddress)
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

    it('publicPresale: add owner as non-owner fails', async () => {
        await expect(publicPresale1.addOwner(wallet2.address))
            .to.be.revertedWith('NotAnOwner')
    })

    it('publicPresale: add owner with invalid address fails', async () => {
        const invalidAddress = constants.ZERO_ADDRESS
        await expect(publicPresale.addOwner(invalidAddress))
            .to.be.revertedWith('ZeroAddress')
    })

    it('publicPresale: whitelist add', async () => {
        const users = [wallet1.address, wallet2.address]
        
        await publicPresale.whitelistAdd(users)

        // users should be whitelisted
        expect(await publicPresale.whitelist(wallet1.address)).to.be.true
        expect(await publicPresale.whitelist(wallet2.address)).to.be.true
    })

    it('publicPresale: whitelist add as non-owner fails', async () => {
        const users = [wallet1.address, wallet2.address]
        await expect(publicPresale1.whitelistAdd(users))
            .to.be.revertedWith('NotAnOwner')
    })

    it('publicPresale: whitelist remove', async () => {
        // first add users
        const users = [wallet1.address, wallet2.address]
        await publicPresale.whitelistAdd(users)

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

    it('publicPresale: whitelist remove as non-owner fails', async () => {
        // first add users
        const users = [wallet1.address, wallet2.address]
        await publicPresale.whitelistAdd(users)

        await expect(publicPresale1.whitelistRemove(wallet1.address))
            .to.be.revertedWith('NotAnOwner')
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

        const expectedInputTokenOutAmountIn1 = expandTo18Decimals(100)
        const expectedOutputTokenOutAmountIn1 = expandTo18Decimals(5000)
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

    it('publicPresale: set purchase phase', async () => {
        await publicPresale.setPurchasePhase(0);
        expect(await publicPresale.purchasePhase()).to.eq(0)

        await publicPresale.setPurchasePhase(1);
        expect(await publicPresale.purchasePhase()).to.eq(1)

        await publicPresale.setPurchasePhase(2);
        expect(await publicPresale.purchasePhase()).to.eq(2)
    })

    it('publicPresale: set purchase phase as non-owner fails', async () => {
        const phase = 0
        // wallet 1 is not an owner
        await expect(publicPresale1.setPurchasePhase(phase))
            .to.be.revertedWith("NotAnOwner")
    })

    it('publicPresale: set purchase phase with invalid phase fails', async () => {
        const invalidPhase = 3
        await expect(publicPresale.setPurchasePhase(invalidPhase))
            .to.be.revertedWith("revert")
    })

    it('publicPresale: set purchase phase emits set purchase phase event', async () => {
        const phase = 0    
        const phaseDuration = (await publicPresale.PURCHASE_PHASE_DURATION()).toNumber()
        await expect(publicPresale.setPurchasePhase(phase))
            .to.emit(publicPresale, 'SetPurchasePhase')
    }) 

    it('publicPresale: purchase in phase 1', async () => {
        const inputToken = tokenA.address 
        const user = wallet1.address            // account to whitelist
        const amount = 100                      // number of tickets purchased by user
        const purchasePhase = 1

        // use to check the updated ticket balance after purchase
        const prevTicketBalance = await publicPresale.ticketsAvailable()

        // expected ticket balance after purchase
        const expectedTicketsAvailable = prevTicketBalance - amount

        // expected input token balance after purchase
        const prevUserInputTokenBalance = await tokenA.balanceOf(user)
        const expectedUserInputTokenBalance = prevUserInputTokenBalance.sub(expandTo18Decimals(amount * inputRate))

        // expected output token balance after purchase
        const prevUserOutputTokenBalance = await helixToken.balanceOf(user)
        const expectedUserOutputTokenBalance = prevUserOutputTokenBalance.add(expandTo18Decimals(amount * outputRate))

        // in phase 1, user needs to be whitelisted to purchase
        await publicPresale.whitelistAdd([user])

        await publicPresale.setPurchasePhase(purchasePhase)

        // get the expected cost in tokens to buy that many tickets
        const tokenAmount = await publicPresale.getAmountOut(amount, inputToken)

        // and have wallet1 pre-approve spending that token amount
        await tokenA1.approve(publicPresale.address, tokenAmount)

        // have wallet1 purchase their tickets
        await publicPresale1.purchase(amount)

        // expect wallet1 balance of input to decrease by the tokenAmount
        expect(await tokenA.balanceOf(user)).to.eq(expectedUserInputTokenBalance)

        // expect wallet1 balance of output token to increase
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserOutputTokenBalance)

        // and expect the total tickes available in the contract to have decreased by amount
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketsAvailable)
    })

    it('publicPresale: purchase in phase 2', async () => {
        const inputToken = tokenA.address 
        const user = wallet1.address            // account to whitelist
        const amount = 100                      // number of tickets purchased by user
        const purchasePhase = 2

        // use to check the updated ticket balance after purchase
        const prevTicketBalance = await publicPresale.ticketsAvailable()

        // expected ticket balance after purchase
        const expectedTicketsAvailable = prevTicketBalance - amount

        // expected input token balance after purchase
        const prevUserInputTokenBalance = await tokenA.balanceOf(user)
        const expectedUserInputTokenBalance = prevUserInputTokenBalance.sub(expandTo18Decimals(amount * inputRate))

        // expected output token balance after purchase
        const prevUserOutputTokenBalance = await helixToken.balanceOf(user)
        const expectedUserOutputTokenBalance = prevUserOutputTokenBalance.add(expandTo18Decimals(amount * outputRate))

        // in phase 2, user does not need to be whitelisted to purchase

        await publicPresale.setPurchasePhase(purchasePhase)

        // get the expected cost in tokens to buy that many tickets
        const tokenAmount = await publicPresale.getAmountOut(amount, inputToken)

        // and have wallet1 pre-approve spending that token amount
        await tokenA1.approve(publicPresale.address, tokenAmount)

        // have wallet1 purchase their tickets
        await publicPresale1.purchase(amount)

        // expect wallet1 balance of input to decrease by the tokenAmount
        expect(await tokenA.balanceOf(user)).to.eq(expectedUserInputTokenBalance)

        // expect wallet1 balance of output token to increase
        expect(await helixToken.balanceOf(user)).to.eq(expectedUserOutputTokenBalance)

        // and expect the total tickes available in the contract to have decreased by amount
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketsAvailable)
    })

    it('publicPresale: burn all tickets while paused as owner', async () => {
        const owner = wallet0.address

        const expectedTokenBalance = 0
        const expectedTicketBalance = 0
       
        // Must be paused to burn
        const paused = 0
        await publicPresale.setPurchasePhase(paused)

        // Remove all tokens and tickets
        const ticketsAvailable = await publicPresale.ticketsAvailable()
        await publicPresale.burn(ticketsAvailable)

        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedTokenBalance)
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketBalance)
    })

    it('publicPresale: burn all tickets while unpaused fails', async () => {
        const ticketsAvailable = await publicPresale.ticketsAvailable()

        const unpaused = 1
        await publicPresale.setPurchasePhase(unpaused)

        await expect(publicPresale.burn(ticketsAvailable))
            .to.be.revertedWith("RemovalProhibited")
    })

    it('publicPresale: burn more tickets than available fails', async () => {
        const ticketsAvailable = expandTo18Decimals(1000000)

        const paused = 0
        await publicPresale.setPurchasePhase(paused)

        await expect(publicPresale.burn(ticketsAvailable))
            .to.be.revertedWith("AmountExceedsTicketsAvailable")
    })

    it('publicPresale: withdraw all tickets while paused as owner', async () => {
        // Must be paused to withdraw as owner
        // must pause before getting maxTokens or else maxTokens == 0
        const paused = 0
        await publicPresale.setPurchasePhase(paused)

        const owner = wallet0.address
        const outputToken = helixToken.address
        const ticketsAvailable = await publicPresale.ticketsAvailable()
        const tokens = await publicPresale.getAmountOut(ticketsAvailable, outputToken)

        const expectedOwnerTokenBalance = (await helixToken.balanceOf(owner)).add(tokens)
        const expectedPresaleTokenBalance = 0
        const expectedTicketBalance = 0
       
        // Remove all tokens and tickets
        await publicPresale.withdraw(ticketsAvailable)

        expect(await helixToken.balanceOf(owner)).to.eq(expectedOwnerTokenBalance)
        expect(await helixToken.balanceOf(publicPresale.address)).to.eq(expectedPresaleTokenBalance)
        expect(await publicPresale.ticketsAvailable()).to.eq(expectedTicketBalance)
    })

    it('publicPresale: withdraw all tickets while unpaused fails', async () => {
        const ticketsAvailable = await publicPresale.ticketsAvailable()

        const unpaused = 1
        await publicPresale.setPurchasePhase(unpaused)

        await expect(publicPresale.withdraw(ticketsAvailable))
            .to.be.revertedWith("RemovalProhibited")
    })

    it('publicPresale: withdraw more tickets than available fails', async () => {
        const ticketsAvailable = expandTo18Decimals(1000000)

        const paused = 0
        await publicPresale.setPurchasePhase(paused)

        await expect(publicPresale.withdraw(ticketsAvailable))
            .to.be.revertedWith("AmountExceedsTicketsAvailable")
    })

    function print(str) {
        if (verbose) console.log(str)
    }
    */
})
