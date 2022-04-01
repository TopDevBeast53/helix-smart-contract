import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import AirDrop from '../build/contracts/AirDrop.json'
import TestToken from '../build/contracts/TestToken.json'
import HelixToken from '../build/contracts/HelixToken.json'

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

const initialBalance = initials.AIRDROP_INITIAL_BALANCE[env.network]

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const SECONDS_PER_DAY = 86400
const wallet1InitialBalance = 1000

const verbose = true

describe('AirDrop Presale', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [wallet0, wallet1, wallet2] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    let airDrop: Contract
    let helixToken: Contract    // output token

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let airDrop1: Contract
    let helixToken1: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        airDrop = fullExchange.airDrop
        helixToken = fullExchange.helixToken

        // Make self a helix token minter and mint to public presale initial balance
        await helixToken.addMinter(wallet0.address)
        await helixToken.mint(airDrop.address, expandTo18Decimals(initialBalance))

        // Pre-approve the presale to spend caller's funds
        await helixToken.approve(airDrop.address, MaxUint256)
    
        // create the wallet 1 owned contracts
        airDrop1 = new Contract(airDrop.address, JSON.stringify(AirDrop.abi), provider).connect(wallet1)   
        helixToken1 = new Contract(helixToken.address, JSON.stringify(HelixToken.abi), provider).connect(wallet1)   
    })

    it('airDrop: initialized with expected values', async () => {
        expect(await airDrop.token()).to.eq(helixToken.address)
        expect(await helixToken.balanceOf(airDrop.address))
            .to.eq(expandTo18Decimals(initialBalance))
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
        expect((await airDrop.users(wallet1.address)).balance).to.eq(wallet1Amount)
        expect((await airDrop.users(wallet2.address)).balance).to.eq(wallet2Amount)
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
        expect((await airDrop.users(wallet1.address)).balance).to.eq(0)
        // make sure that wallet 2 isn't removed too
        expect((await airDrop.users(wallet2.address)).balance).to.eq(wallet2Amount)

        // remove wallet 2
        await airDrop.airdropRemove(wallet2.address, wallet2Amount)
        expect((await airDrop.users(wallet1.address)).balance).to.eq(0)
        expect((await airDrop.users(wallet2.address)).balance).to.eq(0)
    })

    it('airDrop: pause', async () => {
        await airDrop.pause()
        expect(await airDrop.isPaused()).to.be.true
    })

    it('airDrop: unpause', async () => {
        await airDrop.pause()
        await airDrop.unpause()
        expect(await airDrop.isPaused()).to.be.false
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

    it('airDrop: max removable by owner when unpaused', async () => {
        const owner = wallet0.address
        await airDrop.unpause()
        const expectedAmount = 0
        expect(await airDrop.maxRemovable(owner)).to.eq(expectedAmount)
    })

    it('airDrop: max removable by owner when paused', async () => {
        const owner = wallet0.address
        await airDrop.pause()
        const expectedAmount = await airDrop.tokenBalance()
        expect(await airDrop.maxRemovable(owner)).to.eq(expectedAmount)
    })

    it('airDrop: max removable by user when paused', async () => {
        const user = wallet1.address
        await airDrop.pause()
        const expectedAmount = 0
        expect(await airDrop.maxRemovable(user)).to.eq(expectedAmount)
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

    it('airDrop: burn all tokens while paused as owner', async () => {
        const expectedTokenBalance = 0
       
        // Must be paused to burn
        await airDrop.pause()

        // Remove all tokens
        await airDrop.burn(await airDrop.tokenBalance())

        expect(await helixToken.balanceOf(airDrop.address)).to.eq(expectedTokenBalance)
    })

    it('airDrop: withdraw all tokens while paused as owner', async () => {
        // Must be paused to withdraw as owner
        // must pause before getting maxTokens or else maxTokens == 0
        await airDrop.pause()

        const airdropBalance = await airDrop.tokenBalance()
        const expectedAirdropBalance = 0
        const expectedOwnerBalance = (await helixToken.balanceOf(wallet0.address)).add(airdropBalance)
       
        // Remove all tokens and tickets
        await airDrop.withdraw(airdropBalance)

        expect(await helixToken.balanceOf(airDrop.address)).to.eq(expectedAirdropBalance)
        expect(await helixToken.balanceOf(wallet0.address)).to.eq(expectedOwnerBalance)
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
