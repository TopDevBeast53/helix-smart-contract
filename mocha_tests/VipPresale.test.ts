import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import VipPresale from '../build/contracts/VipPresale.json'

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

    // Vault owned by wallet1, used for checking isOwner privileges
    let _vipPresale: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        vipPresale = fullExchange.vipPresale
        tokenA = fullExchange.tokenA
        tokenB = fullExchange.tokenB
        helixToken = fullExchange.helixToken

        // Fund presale with reward tokens
        await helixToken.transfer(vipPresale.address, expandTo18Decimals(initialBalance))

        // Pre-approve the presale to spend caller's funds
        await helixToken.approve(vipPresale.address, MaxUint256)

        // Create the wallet1 owned presale for testing ownership functions 
        _vipPresale = new Contract(vipPresale.address, JSON.stringify(VipPresale.abi), provider).connect(wallet1)   
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

        const expectedInputTokenOutAmountIn1 = 5
        const expectedOutputTokenOutAmountIn1 = 400
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

    it('vipPresale: unpause', async () => {
        await vipPresale.pause()
        await vipPresale.unpause()
        expect(await vipPresale.isPaused()).to.be.false
    })

    it('vipPresale: set purchase phase', async () => {
        await vipPresale.setPurchasePhase(0);
        expect(await vipPresale.purchasePhase()).to.eq(0)

        await vipPresale.setPurchasePhase(1);
        expect(await vipPresale.purchasePhase()).to.eq(1)

        await vipPresale.setPurchasePhase(2);
        expect(await vipPresale.purchasePhase()).to.eq(2)
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

    it('vipPresale: max removable by user when paused', async () => {
        const user = wallet1.address
        await vipPresale.pause()
        const expectedAmount = 0
        expect(await vipPresale.maxRemovable(user)).to.eq(expectedAmount)
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
