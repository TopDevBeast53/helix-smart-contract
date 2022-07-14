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

const initialBalance = initials.AIRDROP_INITIAL_BALANCE[env.testNetwork]

const SECONDS_PER_DAY = 86400
const wallet1InitialBalance = 1000

describe('AirDrop Presale', () => {
    let wallet0, wallet1, wallet2

    let airDrop
    let helixToken

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let airDrop1
    let helixToken1

    beforeEach(async () => {
        [wallet0, wallet1, wallet2] = await ethers.getSigners()
        
        const fullExchange = await loadFixture(fullExchangeFixture)
        airDrop = fullExchange.airdrop
        helixToken = fullExchange.helixToken

        // Make self a helix token minter and mint to public presale initial balance
        await helixToken.addMinter(wallet0.address)
        await helixToken.mint(airDrop.address, expandTo18Decimals(initialBalance))

        // Pre-approve the presale to spend caller's funds
        await helixToken.approve(airDrop.address, expandTo18Decimals(100000))
    
        // create the wallet 1 owned contracts
        airDrop1 = airDrop.connect(wallet1)

        helixToken1 = helixToken.connect(wallet1)
    })

    it('airDrop: initialized with expected values', async () => {
        expect(await airDrop.token()).to.eq(helixToken.address)
        expect(await helixToken.balanceOf(airDrop.address))
            .to.eq(expandTo18Decimals(initialBalance))
    })

    it("airDrop: get contract token balance", async () => {
        expect(await airDrop.getContractTokenBalance()).to.eq(await helixToken.balanceOf(airDrop.address))
    })

    it('airDrop: get owners', async () => {
       const owners = await airDrop.getOwners()
       expect(owners.length).to.eq(1)
       expect(owners[0]).to.eq(wallet0.address)
    })

    it('airDrop: add owner', async () => {
        expect(await airDrop.isOwner(wallet1.address)).to.be.false
        await airDrop.addOwner(wallet1.address)
        expect(await airDrop.isOwner(wallet1.address)).to.be.true

        const owners = await airDrop.getOwners()
        expect(owners.length).to.eq(2)
        expect(owners[1]).to.eq(wallet1.address)
    })

    it('airDrop: add owner as non-owner fails', async () => {
        await expect(airDrop1.addOwner(wallet2.address))
            .to.be.revertedWith('AirDrop: not owner')
    })

    it('airDrop: airdrop add', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1Amount = 50
        const wallet2Amount = 100
        const amounts = [wallet1Amount, wallet2Amount]
        
        await airDrop.airdropAdd(users, amounts)

        // users should receive airdropped funds
        expect((await airDrop.users(wallet1.address)).airdropped).to.eq(wallet1Amount)
        expect((await airDrop.users(wallet2.address)).airdropped).to.eq(wallet2Amount)

        // and have a balance
        expect(await airDrop.getBalance(wallet1.address)).to.eq(wallet1Amount)
        expect(await airDrop.getBalance(wallet2.address)).to.eq(wallet2Amount)
    })

    it('airDrop: airdrop add as non-owner fails', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1Amount = 50
        const wallet2Amount = 100
        const amounts = [wallet1Amount, wallet2Amount]
        
        await expect(airDrop1.airdropAdd(users, amounts))
            .to.be.revertedWith('AirDrop: not owner')
    })

    it('airDrop: airdrop add with unequal argument arrays fails', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1Amount = 50
        const amounts = [wallet1Amount]
        
        await expect(airDrop.airdropAdd(users, amounts))
            .to.be.revertedWith('AirDrop: users and amounts must be same length')
    })

    it('airDrop: airdrop add user with too many tokens fails', async () => {
        const users = [wallet1.address, wallet2.address]
        const wallet1Amount = expandTo18Decimals(10000000000000)
        const wallet2Amount = 100
        const amounts = [wallet1Amount, wallet2Amount]
        
        await expect(airDrop.airdropAdd(users, amounts))
            .to.be.revertedWith("AirDrop: insufficient tokens available")
    })

    it('airDrop: airdrop add when amount sum exceeds contract balance fails', async () => {
        const contractBalance = await airDrop.getContractTokenBalance()

        const users = [wallet1.address, wallet2.address]
        const wallet1Amount = contractBalance.div(2)
        const wallet2Amount = contractBalance.div(2).add(1)
        const amounts = [wallet1Amount, wallet2Amount]
        
        await expect(airDrop.airdropAdd(users, amounts))
            .to.be.revertedWith("AirDrop: insufficient tokens available")
    })

    it('airDrop: airdrop remove', async () => {
        // first airdrop funds
        const users = [wallet1.address, wallet2.address]
        const wallet1Amount = 50
        const wallet2Amount = 100
        const amounts = [wallet1Amount, wallet2Amount]
        
        await airDrop.airdropAdd(users, amounts)

        // remove wallet 1
        await airDrop.airdropRemove(wallet1.address, wallet1Amount)
        expect(await airDrop.getBalance(wallet1.address)).to.eq(0)
        // make sure that wallet 2 isn't removed too
        expect(await airDrop.getBalance(wallet2.address)).to.eq(wallet2Amount)

        // remove wallet 2
        await airDrop.airdropRemove(wallet2.address, wallet2Amount)
        expect(await airDrop.getBalance(wallet1.address)).to.eq(0)
        expect(await airDrop.getBalance(wallet2.address)).to.eq(0)
    })

    it('airDrop: airdrop remove as non-owner fails', async () => {
        // first airdrop funds
        const users = [wallet1.address, wallet2.address]
        const wallet1Amount = 50
        const wallet2Amount = 100
        const amounts = [wallet1Amount, wallet2Amount]

        await airDrop.airdropAdd(users, amounts)
    
        // then expect to fail
        await expect(airDrop1.airdropRemove(wallet1.address, wallet1Amount))
            .to.be.revertedWith('AirDrop: not owner')
    })

    it('airDrop: set withdraw phase', async () => {
        await airDrop.setWithdrawPhase(0);
        expect(await airDrop.withdrawPhase()).to.eq(0)

        await airDrop.setWithdrawPhase(1);
        expect(await airDrop.withdrawPhase()).to.eq(1)

        await airDrop.setWithdrawPhase(2);
        expect(await airDrop.withdrawPhase()).to.eq(2)

        await airDrop.setWithdrawPhase(3);
        expect(await airDrop.withdrawPhase()).to.eq(3)

        await airDrop.setWithdrawPhase(4);
        expect(await airDrop.withdrawPhase()).to.eq(4)

        await airDrop.setWithdrawPhase(5);
        expect(await airDrop.withdrawPhase()).to.eq(5)
    })

    it('airDrop: set withdraw phase as non-owner fails', async () => {
        const phase = 0
        await expect(airDrop1.setWithdrawPhase(phase))
            .to.be.revertedWith('AirDrop: not owner')
    })

    it('airDrop: set withdraw phase with invalid phase fails', async () => {
        const invalidPhase = 6
        await expect(airDrop.setWithdrawPhase(invalidPhase))
            .to.be.revertedWith('revert')
    })

    it('airDrop: set withdraw phase emits set withdraw phase event', async () => {
        const phase = 0
        const phaseDuration = (await airDrop.WITHDRAW_PHASE_DURATION()).toNumber()
        await expect(airDrop.setWithdrawPhase(phase))
            .to.emit(airDrop, "SetWithdrawPhase")
    })

    it('airDrop: max removable by user when paused', async () => {
        const user = wallet1.address

        const paused = 0
        await airDrop.setWithdrawPhase(paused)

        const expectedAmount = 0
        expect(await airDrop.getMaxAmount(user)).to.eq(expectedAmount)
    })

    it('airDrop: withdraw 25% of airdrop in phase 2', async () => {
        const token = helixToken.address 
        const user = wallet1.address                    // account of user
        const airdropAmount = 100                       // number of tokens airdropped to user
        const withdrawPhase = 2                         // allow up to 25% purchased withdrawal
        const withdrawAmount = 25                       // amount withdrawn by user
        const withdrawPercent = 0.25                    // max percent withdrawable in this withdraw phase
    
        const expectedUserBalance = withdrawAmount

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(airdropAmount * withdrawPercent)

        // make an airdrop
        await airDrop.airdropAdd([user], [expandTo18Decimals(airdropAmount)])

        // now make a withdrawal

        // first set the correct phase
        await airDrop.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await airDrop1.withdraw(expandTo18Decimals(withdrawAmount))

        // check that the updated amounts match the expectations
        const userBalance = (await helixToken.balanceOf(user)).div(expandTo18Decimals(1))
        expect(userBalance).to.eq(expectedUserBalance)
    })

    it('airDrop: withdraw 50% of airdrop in phase 3', async () => {
        const token = helixToken.address 
        const user = wallet1.address                    // account of user
        const airdropAmount = 100                       // number of tokens airdropped to user
        const withdrawPhase = 3                         // allow up to 25% purchased withdrawal
        const withdrawAmount = 50                       // amount withdrawn by user
        const withdrawPercent = 0.50                    // max percent withdrawable in this withdraw phase
    
        const expectedUserBalance = withdrawAmount

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(airdropAmount * withdrawPercent)

        // make an airdrop
        await airDrop.airdropAdd([user], [expandTo18Decimals(airdropAmount)])

        // now make a withdrawal

        // first set the correct phase
        await airDrop.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await airDrop1.withdraw(expandTo18Decimals(withdrawAmount))

        // check that the updated amounts match the expectations
        const userBalance = (await helixToken.balanceOf(user)).div(expandTo18Decimals(1))
        expect(userBalance).to.eq(expectedUserBalance)
    })

    it('airDrop: withdraw 75% of airdrop in phase 4', async () => {
        const token = helixToken.address 
        const user = wallet1.address                    // account of user
        const airdropAmount = 100                       // number of tokens airdropped to user
        const withdrawPhase = 4                         // allow up to 25% purchased withdrawal
        const withdrawAmount = 75                       // amount withdrawn by user
        const withdrawPercent = 0.75                    // max percent withdrawable in this withdraw phase
    
        const expectedUserBalance = withdrawAmount

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(airdropAmount * withdrawPercent)

        // make an airdrop
        await airDrop.airdropAdd([user], [expandTo18Decimals(airdropAmount)])

        // now make a withdrawal

        // first set the correct phase
        await airDrop.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await airDrop1.withdraw(expandTo18Decimals(withdrawAmount))

        // check that the updated amounts match the expectations
        const userBalance = (await helixToken.balanceOf(user)).div(expandTo18Decimals(1))
        expect(userBalance).to.eq(expectedUserBalance)
    })

    it('airDrop: withdraw 100% of airdrop in phase 5', async () => {
        const token = helixToken.address 
        const user = wallet1.address                    // account of user
        const airdropAmount = 100                       // number of tokens airdropped to user
        const withdrawPhase = 5                         // allow up to 25% purchased withdrawal
        const withdrawAmount = 100                      // amount withdrawn by user
        const withdrawPercent = 100                     // max percent withdrawable in this withdraw phase
    
        const expectedUserBalance = withdrawAmount

        // check that the test varibles are set correctly
        expect(withdrawAmount).to.not.be.above(airdropAmount * withdrawPercent)

        // make an airdrop
        await airDrop.airdropAdd([user], [expandTo18Decimals(airdropAmount)])

        // now make a withdrawal

        // first set the correct phase
        await airDrop.setWithdrawPhase(withdrawPhase)

        // withdraw as user
        await airDrop1.withdraw(expandTo18Decimals(withdrawAmount))

        // check that the updated amounts match the expectations
        const userBalance = (await helixToken.balanceOf(user)).div(expandTo18Decimals(1))
        expect(userBalance).to.eq(expectedUserBalance)
    })

    it('airDrop: burn all tokens as owner', async () => {
        const expectedTokenBalance = 0
       
        // Must be paused to burn
        const paused = 0
        await airDrop.setWithdrawPhase(paused)

        // Remove all tokens
        await airDrop.burn(await airDrop.getContractTokenBalance())

        expect(await helixToken.balanceOf(airDrop.address)).to.eq(expectedTokenBalance)
    })

    it("airDrop: burn as non-owner fails", async () => {
        const airDropWallet2 = airDrop.connect(wallet2)
        await expect(airDropWallet2.burn(1))
            .to.be.revertedWith("AirDrop: not owner")
    })

    it('airDrop: emergency withdraw all tokens', async () => {
        const airdropBalance = await airDrop.getContractTokenBalance()
        const expectedAirdropBalance = 0
        const expectedOwnerBalance = (await helixToken.balanceOf(wallet0.address)).add(airdropBalance)
       
        // Remove all tokens and tickets
        await airDrop.emergencyWithdraw(airdropBalance)

        expect(await helixToken.balanceOf(airDrop.address)).to.eq(expectedAirdropBalance)
        expect(await helixToken.balanceOf(wallet0.address)).to.eq(expectedOwnerBalance)
    })

    it("airDrop: withdraw when paused fails", async () => {
        await airDrop.pause();
        await expect(airDrop.withdraw(10))
            .to.be.revertedWith("Pausable: paused")
    })

    it("airDrop: emergency withdraw when not owner fails", async () => {
        expect(await airDrop.isOwner(wallet2.address)).to.be.false
        const airDropWallet2 = airDrop.connect(wallet2)
        await expect(airDropWallet2.emergencyWithdraw(10))
            .to.be.revertedWith("AirDrop: not owner")
    })

    function print(str) {
        if (verbose) console.log(str)
    }
})
