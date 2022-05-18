import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import LpSwap from '../build/contracts/LpSwap.json'
import TestToken from '../build/contracts/TestToken.json'

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const ONE_DAY = 86400       // one day in seconds

const verbose = true

describe('Lp Swap', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [wallet0, wallet1, wallet2] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    // contracts owned by wallet0
    let tokenA: Contract        // Let tokenA be the toBuyer token
    let tokenB: Contract        // Let tokenB be the toSeller token
    let lpSwap: Contract

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let lpSwap1: Contract
    let tokenA1: Contract
    let tokenB1: Contract

    // contracts owned by wallet 2, used when wallet 2 should be msg.sender 
    let lpSwap2: Contract
    let tokenB2: Contract

    let amount: BigNumber
    let ask: BigNumber

    let bidAmount: BigNumber

    const balanceWallet1 = expandTo18Decimals(1000)

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        tokenA = fullExchange.tokenA
        tokenB = fullExchange.tokenB
        lpSwap = fullExchange.lpSwap

        // set default open swap parameters
        amount = expandTo18Decimals(1000)
        ask = expandTo18Decimals(900)

        bidAmount = expandTo18Decimals(500)

        // create the wallet 1 owned contracts
        lpSwap1 = new Contract
            (
                lpSwap.address, 
                JSON.stringify(LpSwap.abi), 
                provider
            )
            .connect(wallet1)

        tokenA1 = new Contract
            (
                tokenA.address, 
                JSON.stringify(TestToken.abi), 
                provider
            )
            .connect(wallet1)

        tokenB1 = new Contract
            (
                tokenB.address, 
                JSON.stringify(TestToken.abi), 
                provider
            )
            .connect(wallet1)


        // create the wallet 2 owned contracts
        lpSwap2 = new Contract
            (
                lpSwap.address, 
                JSON.stringify(LpSwap.abi), 
                provider
            )
            .connect(wallet2)

        tokenB2 = new Contract
            (
                tokenB.address, 
                JSON.stringify(TestToken.abi), 
                provider
            )
            .connect(wallet2)

        // transfer tokenB (toSellerToken) from wallet 0 to wallet 1
        await tokenB.transfer(wallet1.address, balanceWallet1)
    })

    it('lpSwap: initialized with expected values', async () => {
        expect(await lpSwap.treasury()).to.eq(wallet0.address)           // use wallet0 to make checking balance change easy
    })

    it('lpSwap: open swap with invalid toBuyer token fails', async () => {
        const invalidToBuyerToken = constants.AddressZero
        await expect(lpSwap.openSwap(invalidToBuyerToken, tokenB.address, amount, ask))
            .to.be.revertedWith("LpSwap: zero address")
    })

    it('lpSwap: open swap with invalid toSeller token fails', async () => {
        const invalidToSellerToken = constants.AddressZero
        await expect(lpSwap.openSwap(tokenA.address, invalidToSellerToken, amount, ask))
            .to.be.revertedWith("LpSwap: zero address")
    })

    it('lpSwap: open swap with invalid amount fails', async () => {
        const invalidAmount = 0
        await expect(lpSwap.openSwap(tokenA.address, tokenB.address, invalidAmount, ask))
            .to.be.revertedWith("LpSwap: not above zero")
    })

    it('lpSwap: open swap with insufficient token balance fails', async () => {
        const invalidAmount = (await tokenA.balanceOf(wallet0.address)).add(expandTo18Decimals(1))
        await expect(lpSwap.openSwap(tokenA.address, tokenB.address, invalidAmount, ask))
            .to.be.revertedWith("LpSwap: insufficient balance")
    })

    it('lpSwap: open swap with insufficient token allowance fails', async () => {
        // No allowance given to lpSwap
        await expect(lpSwap.openSwap(tokenA.address, tokenB.address, amount, ask))
            .to.be.revertedWith("LpSwap: insufficient allowance")
    })

    it('lpSwap: open swap', async () => {
        await openSwap()

        // check that the swap was opened and values correctly set
        const swapId = await lpSwap.getSwapId()
        const expectedSwapId = 0
        expect(swapId).to.eq(expectedSwapId)

        // get the swap
        const swap = await lpSwap.getSwap(swapId)
        
        const expectedToBuyerToken = tokenA.address
        const expectedToSellerToken = tokenB.address
        const expectedSeller = wallet0.address
        const expectedBuyer = constants.AddressZero
        const expectedAmount = amount
        const expectedAsk = ask
        const expectedIsOpen = true
    
        expect(swap.toBuyerToken).to.eq(expectedToBuyerToken)
        expect(swap.toSellerToken).to.eq(expectedToSellerToken)
        expect(swap.seller).to.eq(expectedSeller)
        expect(swap.buyer).to.eq(expectedBuyer)
        expect(swap.amount).to.eq(expectedAmount)
        expect(swap.ask).to.eq(expectedAsk)
        expect(swap.isOpen).to.eq(expectedIsOpen)

        const expectedSwapIds = [0]
        expect((await lpSwap.getSwapIds(wallet0.address))[0]).to.eq(expectedSwapIds[0])
    })

    it('lpSwap: open swap emits SwapOpened event', async () => {
        // must set an allowance
        await tokenA.approve(lpSwap.address, amount)

        // open the swap
        const expectedSwapId = 0
        await expect(lpSwap.openSwap(tokenA.address, tokenB.address, amount, ask))
            .to.emit(lpSwap, 'SwapOpened')
            .withArgs(expectedSwapId)
    })

    it('lpSwap: set ask with invalid swapId fails', async () => {
        // expect to fail because no swap opened
        const invalidSwapId0 = 0
        await expect(lpSwap.setAsk(invalidSwapId0, ask))
            .to.be.revertedWith("LpSwap: no swap opened")

        // open swap
        await openSwap() 

        // expect to fail because swapId too large
        const invalidSwapId1 = (await lpSwap.getSwapId()) + 1
        await expect(lpSwap.setAsk(invalidSwapId1, ask))
            .to.be.revertedWith("LpSwap: invalid swap id")
    })

    it('lpSwap: set ask when swap is closed fails', async () => {
        await openSwap()

        // get the most recently opened swap
        const swapId = await lpSwap.getSwapId()

        // close the swap
        await lpSwap.closeSwap(swapId)

        // the swap is closed and setting the ask should be prohibited
        await expect(lpSwap.setAsk(swapId, ask))
            .to.be.revertedWith("LpSwap: swap is closed")
    })

    it('lpSwap: set ask when not seller fails', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()

        // expect calling set ask as wallet 1 to fail
        await expect(lpSwap1.setAsk(swapId, ask))
            .to.be.revertedWith("LpSwap: caller is not seller")
    })

    it('lpSwap: set ask', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()
        const expectedAsk = expandTo18Decimals(10000)
        await lpSwap.setAsk(swapId, expectedAsk)

        expect((await lpSwap.getSwap(swapId)).ask).to.eq(expectedAsk)
    })

    it('lpSwap: set ask emits AskSet event', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()
        const expectedAsk = expandTo18Decimals(10000)

        await expect(lpSwap.setAsk(swapId, expectedAsk))
            .to.emit(lpSwap, "AskSet")
            .withArgs(swapId)
    })

    it('lpSwap: close swap with invalid swapId fails', async () => {
        // expect to fail because no swap opened
        const invalidSwapId0 = 0
        await expect(lpSwap.closeSwap(invalidSwapId0))
            .to.be.revertedWith("LpSwap: no swap opened")

        // open swap
        await openSwap() 

        // expect to fail because swapId too large
        const invalidSwapId1 = (await lpSwap.getSwapId()) + 1
        await expect(lpSwap.closeSwap(invalidSwapId1))
            .to.be.revertedWith("LpSwap: invalid swap id")
    })

    it('lpSwap: close swap when swap is closed fails', async () => {
        await openSwap()

        // get the most recently opened swap
        const swapId = await lpSwap.getSwapId()

        // close the swap
        await lpSwap.closeSwap(swapId)

        // the swap is closed and closing again should be prohibited
        await expect(lpSwap.closeSwap(swapId))
            .to.be.revertedWith("LpSwap: swap is closed")
    })

    it('lpSwap: close swap when not seller fails', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()

        // expect calling set ask as wallet 1 to fail
        await expect(lpSwap1.closeSwap(swapId))
            .to.be.revertedWith("LpSwap: caller is not seller")
    })

    it('lpSwap: close swap', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()
        const expectedIsOpen = false
        await lpSwap.closeSwap(swapId)

        expect((await lpSwap.getSwap(swapId)).isOpen).to.eq(expectedIsOpen)
    })

    it('lpSwap: close swap emits SwapClosed event', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()
        const expectedIsOpen = false

        await expect(lpSwap.closeSwap(swapId))
            .to.emit(lpSwap, "SwapClosed")
            .withArgs(swapId)
    })

    it('lpSwap: make bid when swap is closed fails', async () => {
        await openSwap()

        // get the most recently opened swap
        const swapId = await lpSwap.getSwapId()

        // close the swap
        await lpSwap.closeSwap(swapId)

        // the swap is closed and making bid should be prohibited
        await expect(lpSwap.makeBid(swapId, bidAmount))
            .to.be.revertedWith("LpSwap: swap is closed")
    })

    it('lpSwap: make bid as seller fails', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()

        // expect making bid as seller to fail
        await expect(lpSwap.makeBid(swapId, bidAmount))
            .to.be.revertedWith("LpSwap: caller is seller")
    })

    it('lpSwap: make bid on same swap more than once fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        // expect making second bid on same swap to fail
        await expect(lpSwap1.makeBid(swapId, bidAmount))
            .to.be.revertedWith("LpSwap: caller has already bid")
    })

    it('lpSwap: make bid with no amount fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        
        // set the bid amount to 0
        bidAmount = expandTo18Decimals(0)

        // expect making second bid on same swap to fail
        await expect(lpSwap1.makeBid(swapId, bidAmount))
            .to.be.revertedWith("LpSwap: not above zero")
    })

    it('lpSwap: make bid with insufficient token balance fails', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()
        const invalidAmount = (await tokenB.balanceOf(wallet1.address)).add(expandTo18Decimals(1))

        await expect(lpSwap1.makeBid(swapId, invalidAmount))
            .to.be.revertedWith("LpSwap: insufficient balance")
    })

    it('lpSwap: make bid with insufficient token allowance fails', async () => {
        await openSwap()

        const swapId = await lpSwap.getSwapId()
        const invalidAmount = (await tokenA.allowance(wallet1.address, lpSwap.address)).add(expandTo18Decimals(1))

        await expect(lpSwap1.makeBid(swapId, invalidAmount))
            .to.be.revertedWith("LpSwap: insufficient allowance")
    })

    it('lpSwap: make bid', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
       
        // Check that the bid id was set
        const expectedBidId = 0
        const bidId = await lpSwap.getBidId()
        expect(bidId).to.eq(expectedBidId)

        // Check that the bid was created
        const bid = await lpSwap.getBid(bidId)

        const expectedBidder = wallet1.address
        const expectedSwapId = swapId
        const expectedAmount = bidAmount

        expect(bid.bidder).to.eq(expectedBidder)
        expect(bid.swapId).to.eq(expectedSwapId)
        expect(bid.amount).to.eq(expectedAmount)

        // Check that the bid was added to the swap
        const swap = await lpSwap.getSwap(swapId)
        expect(swap.bidIds[0]).to.eq(expectedBidId)
    
        // Check that the bid was added to the buyers list of bids  
        expect((await lpSwap.getBidIds(wallet1.address))[0]).to.eq(expectedBidId)

        // Check that the address has bid on the swap
        expect(await lpSwap.hasBidOnSwap(wallet1.address, swapId)).to.be.true
    })

    it('lpSwap: make bid emits BidMade event', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()

        // must set an allowance
        await tokenB1.approve(lpSwap.address, bidAmount)

        const expectedBidId = 0;
        
        // make the bid
        await expect(lpSwap1.makeBid(swapId, bidAmount))
            .to.emit(lpSwap, 'BidMade')
            .withArgs(expectedBidId)
    })

    it('lpSwap: set bid with invalid bidId fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        const invalidBidId = (await lpSwap.getBidId()).add(1)
        await expect(lpSwap1.setBid(invalidBidId, bidAmount))
            .to.be.revertedWith("LpSwap: invalid bid id")
    })

    it('lpSwap: set bid when swap is closed fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
    
        // close the swap
        await lpSwap.closeSwap(swapId)

        await expect(lpSwap1.setBid(bidId, bidAmount))
            .to.be.revertedWith("LpSwap: swap is closed")
    })

    it('lpSwap: set bid when caller is not bidder fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
    
        // expect to fail because bid was made by wallet1
        await expect(lpSwap.setBid(bidId, bidAmount))
            .to.be.revertedWith("LpSwap: caller is not bidder")
    })

    it('lpSwap: set bid with insufficient token balance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
    
        const invalidBidAmount = balanceWallet1.add(expandTo18Decimals(1))
        await expect(lpSwap1.setBid(bidId, invalidBidAmount))
            .to.be.revertedWith("LpSwap: insufficient balance")
    })

    it('lpSwap: set bid with insufficient token allowance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
    
        const invalidBidAmount = bidAmount.add(expandTo18Decimals(1))
        await expect(lpSwap1.setBid(bidId, invalidBidAmount))
            .to.be.revertedWith("LpSwap: insufficient allowance")
    })

    it('lpSwap: set bid', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
    
        const expectedBidAmount = expandTo18Decimals(1)
        await lpSwap1.setBid(bidId, expectedBidAmount)

        const bid = await lpSwap.getBid(bidId)
        expect(bid.amount).to.eq(expectedBidAmount)
    })

    it('lpSwap: set bid amount to zero closes bid', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
    
        const expectedBidAmount = expandTo18Decimals(0)

        await lpSwap1.setBid(bidId, expectedBidAmount)

        const bid = await lpSwap.getBid(bidId)

        expect(bid.amount).to.eq(expectedBidAmount)
    })

    it('lpSwap: set bid amount to greater than zero re-opens closed bid', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
   
        // set amount to 0 to close the bid
        let expectedBidAmount = expandTo18Decimals(0)
        await lpSwap1.setBid(bidId, expectedBidAmount)

        // get the bid to check that it's closed
        let bid = await lpSwap.getBid(bidId)

        // bid should be closed
        expect(bid.amount).to.eq(expectedBidAmount)

        // set amount to greater than 0 to re-open the bid
        expectedBidAmount = expandTo18Decimals(100)
        await lpSwap1.setBid(bidId, expectedBidAmount)

        // get the bid to check that it's opened
        bid = await lpSwap.getBid(bidId)

        // bid should be re-opened
        expect(bid.amount).to.eq(expectedBidAmount)
    })

    it('lpSwap: set bid emits BidSet event', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await lpSwap.getBidId()
    
        await expect(lpSwap1.setBid(bidId, bidAmount))
            .to.emit(lpSwap, 'BidSet')
            .withArgs(bidId)
    })

    it('lpSwap: accept bid with invalid bidId fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        const invalidBidId = (await lpSwap.getBidId()).add(1)

        // accept wallet1 bid as wallet0 with invalid bidId
        await expect(lpSwap.acceptBid(invalidBidId))
            .to.be.revertedWith("LpSwap: invalid bid id")
    })

    it('lpSwap: accept bid as bidder fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
    
        // accept the most recent bid
        const bidId = await lpSwap.getBidId()

        // expect accept wallet1 bid as wallet1 to fail
        await expect(lpSwap1.acceptBid(bidId))
            .to.be.revertedWith("LpSwap: caller is not seller")
    })

    it('lpSwap: accept bid when swap is closed fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)
   
        // close the swap
        await lpSwap.closeSwap(swapId)

        // accept the most recent bid
        const bidId = await lpSwap.getBidId()

        // expect accept bid when swap is closed to fail
        await expect(lpSwap.acceptBid(bidId))
            .to.be.revertedWith("LpSwap: swap is closed")
    })

    it('lpSwap: accept bid with insufficient seller toBuyer token balance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await lpSwap.getBidId()

        // transfer entire wallet0 toBuyer token balance
        await tokenA.transfer(wallet2.address, await tokenA.balanceOf(wallet0.address))

        // check that the balance of wallet 0 is empty
        expect(await tokenA.balanceOf(wallet0.address)).to.eq(0)

        // expect accept bid with no lp token balance to fail
        await expect(lpSwap.acceptBid(bidId))
            .to.be.revertedWith("LpSwap: insufficient balance")
    })

    it('lpSwap: accept bid with insufficient seller toBuyer token allowance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await lpSwap.getBidId()

        // remove entire wallet0 lp token allowance from lp swap
        await tokenA.approve(lpSwap.address, 0)

        // check that the allowance of lp swap is 0
        expect(await tokenA.allowance(wallet0.address, lpSwap.address)).to.eq(0)

        // expect accept bid with no lp token allowance to fail
        await expect(lpSwap.acceptBid(bidId))
            .to.be.revertedWith("LpSwap: insufficient allowance")
    })

    it('lpSwap: accept bid with insufficient bidder toSeller token balance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await lpSwap.getBidId()

        // transfer entire wallet1 ex token balance
        await tokenB1.transfer(wallet2.address, await tokenB.balanceOf(wallet1.address))

        // check that the balance of wallet 1 is empty
        expect(await tokenB.balanceOf(wallet1.address)).to.eq(0)

        // expect accept bid with no ex token balance to fail
        await expect(lpSwap.acceptBid(bidId))
            .to.be.revertedWith("LpSwap: insufficient balance")
    })

    it('lpSwap: accept bid with insufficient bidder toSeller token allowance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await lpSwap.getBidId()

        // remove entire wallet1 ex token allowance from lp swap
        await tokenB1.approve(lpSwap.address, 0)

        // check that the allowance of lp swap is 0
        expect(await tokenB.allowance(wallet1.address, lpSwap.address)).to.eq(0)

        // expect accept bid with no ex token allowance to fail
        await expect(lpSwap.acceptBid(bidId))
            .to.be.revertedWith("LpSwap: insufficient allowance")
    })

    it('lpSwap: accept bid', async () => {
        // set the treasury to be wallet2 so that we can check that it receives treasury fee
        await lpSwap.setTreasury(wallet2.address)

        // set the treasury fees to 0 so that the seller and buyer 
        // receive the full amounts being exchanged
        await lpSwap.setTreasuryPercent(0)
        await lpSwap.setTreasuryPercent(0)
   
        // open the swap and make a bid
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        // get the prev balances before accepting bid to check that correct amounts transfer
        const prevToBuyerBal0 = await tokenA.balanceOf(wallet0.address)
        const prevToSellerBal0 = await tokenB.balanceOf(wallet0.address)
        
        const prevToBuyerBal1 = await tokenA.balanceOf(wallet1.address)
        const prevToSellerBal1 = await tokenB.balanceOf(wallet1.address)

        // accept the bid
        const bidId = await lpSwap.getBidId()
        await lpSwap.acceptBid(bidId)

        // get the swap and bid
        const swap = await lpSwap.getSwap(swapId)
        const bid = await lpSwap.getBid(bidId)

        // expect the swap to be closed
        expect(swap.isOpen).to.be.false

        // expect the swap cost to be set to bid amount
        const expectedCost = bid.amount
        expect(swap.cost).to.eq(expectedCost)

        // expect the buyer to be set to the bidder
        expect(swap.buyer).to.eq(bid.bidder)

        // expect the wallet0 toBuyer token balance to be decreased by amount
        const expectedToBuyerBal0 = prevToBuyerBal0.sub(swap.amount)
        expect(await tokenA.balanceOf(wallet0.address)).to.eq(expectedToBuyerBal0)

        // expect the wallet0 toSeller token balance to be increased by bid amount
        const expectedToSellerBal0 = prevToSellerBal0.add(bid.amount)
        expect(await tokenB.balanceOf(wallet0.address)).to.eq(expectedToSellerBal0)

        // expect the wallet1 toSeller token balance to be decreased by bid amount
        const expectedToSellerBal1 = prevToSellerBal1.sub(bid.amount)
        expect(await tokenB.balanceOf(wallet1.address)).to.eq(expectedToSellerBal1)

        // expect the wallet1 toBuyer token balance to be increased by amount
        const expectedToBuyerBal1 = prevToBuyerBal1.add(swap.amount)
        expect(await tokenA.balanceOf(wallet1.address)).to.eq(expectedToBuyerBal1)
    })

    it('lpSwap: accept bid emits BidAccepted event', async () => {
        // open the swap and make a bid
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        await makeBid(swapId)

        // accept the bid
        const bidId = await lpSwap.getBidId()
        await expect(lpSwap.acceptBid(bidId))
            .to.emit(lpSwap, 'BidAccepted')
            .withArgs(bidId)
    })

    it('lpSwap: accept ask with invalid swapId fails', async () => {
        await openSwap()
        const invalidSwapId = (await lpSwap.getSwapId()).add(1)

        // accept wallet0 ask as wallet1 with invalid swapId
        await expect(lpSwap1.acceptAsk(invalidSwapId))
            .to.be.revertedWith("LpSwap: invalid swap id")
    })

    it('lpSwap: accept ask as seller fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
    
        // expect accept wallet0 ask as wallet0 to fail
        await expect(lpSwap.acceptAsk(swapId))
            .to.be.revertedWith("LpSwap: caller is seller")
    })

    it('lpSwap: accept ask when swap is closed fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()
   
        // close the swap
        await lpSwap.closeSwap(swapId)

        // expect accept ask as wallet1 when swap is closed to fail
        await expect(lpSwap1.acceptAsk(swapId))
            .to.be.revertedWith("LpSwap: swap is closed")
    })

    it('lpSwap: accept ask with insufficient seller toBuyer token balance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()

        // transfer entire wallet0 toBuyer token balance
        await tokenA.transfer(wallet2.address, await tokenA.balanceOf(wallet0.address))

        // check that the balance of wallet 0 is empty
        expect(await tokenA.balanceOf(wallet0.address)).to.eq(0)

        // expect accept ask as wallet0 with no wallet0 toBuyer token balance to fail
        await expect(lpSwap1.acceptAsk(swapId))
            .to.be.revertedWith("LpSwap: insufficient balance")
    })

    it('lpSwap: accept ask with insufficient seller toBuyer token allowance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()

        // remove entire wallet0 toBuyer token allowance from lp swap
        await tokenA.approve(lpSwap.address, 0)

        // check that the allowance of toBuyer swap is 0
        expect(await tokenA.allowance(wallet0.address, lpSwap.address)).to.eq(0)

        // expect accept ask as wallet1 with no wallet0 toBuyer token allowance to fail
        await expect(lpSwap1.acceptAsk(swapId))
            .to.be.revertedWith("LpSwap: insufficient allowance")
    })

    it('lpSwap: accept ask with insufficient buyer toSeller token balance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()

        // transfer entire wallet1 toSeller token balance
        await tokenB1.transfer(wallet2.address, await tokenB.balanceOf(wallet1.address))

        // check that the balance of wallet 1 is empty
        expect(await tokenB.balanceOf(wallet1.address)).to.eq(0)

        // expect accept ask ask wallet1 with no wallet1 ex token balance to fail
        await expect(lpSwap1.acceptAsk(swapId))
            .to.be.revertedWith("LpSwap: insufficient balance")
    })

    it('lpSwap: accept ask with insufficient buyer toSeller token allowance fails', async () => {
        await openSwap()
        const swapId = await lpSwap.getSwapId()

        // remove entire wallet1 ex token allowance from lp swap
        await tokenB1.approve(lpSwap.address, 0)

        // check that the allowance of lp swap is 0
        expect(await tokenB.allowance(wallet1.address, lpSwap.address)).to.eq(0)

        // expect accept ask as wallet0 with no wallet1 ex token allowance to fail
        await expect(lpSwap1.acceptAsk(swapId))
            .to.be.revertedWith("LpSwap: insufficient allowance")
    })

    it('lpSwap: accept ask', async () => {
        // set the treasury to be wallet2 so that we can check that it receives treasury fee
        await lpSwap.setTreasury(wallet2.address)

        // set the treasury fees to 0 so that the seller and buyer 
        // receive the full amounts being exchanged
        await lpSwap.setTreasuryPercent(0)
        await lpSwap.setTreasuryPercent(0)
   
        // open the swap
        await openSwap()
        const swapId = await lpSwap.getSwapId()
        let swap = await lpSwap.getSwap(swapId)

        // get the prev balances before accepting ask to check that correct amounts transfer
        const prevToBuyerBal0 = await tokenA.balanceOf(wallet0.address)
        const prevToSellerBal0 = await tokenB.balanceOf(wallet0.address)
        
        const prevToBuyerBal1 = await tokenA.balanceOf(wallet1.address)
        const prevToSellerBal1 = await tokenB.balanceOf(wallet1.address)

        // must approve the ask as buyer (wallet1)
        await tokenB1.approve(lpSwap.address, swap.ask)

        // accept the ask as buyer (wallet1)
        await lpSwap1.acceptAsk(swapId)

        // get the swap
        swap = await lpSwap.getSwap(swapId)

        // expect the swap to be closed
        expect(swap.isOpen).to.be.false

        // expect the swap cost to be set to the ask
        const expectedCost = swap.ask
        expect(swap.cost).to.eq(swap.ask)

        // expect the buyer to be set to the ask-accepter 
        expect(swap.buyer).to.eq(wallet1.address)

        // expect the wallet0 toBuyer token balance to be decreased by amount
        const expectedToBuyerBal0 = prevToBuyerBal0.sub(swap.amount)
        expect(await tokenA.balanceOf(wallet0.address)).to.eq(expectedToBuyerBal0)

        // expect the wallet0 toSeller token balance to be increased by bid amount
        const expectedToSellerBal0 = prevToSellerBal0.add(swap.ask)
        expect(await tokenB.balanceOf(wallet0.address)).to.eq(expectedToSellerBal0)

        // expect the wallet1 toSeller token balance to be decreased by bid amount
        const expectedToSellerBal1 = prevToSellerBal1.sub(swap.ask)
        expect(await tokenB.balanceOf(wallet1.address)).to.eq(expectedToSellerBal1)

        // expect the wallet1 toBuyer token balance to be increased by amount
        const expectedToBuyerBal1 = prevToBuyerBal1.add(swap.amount)
        expect(await tokenA.balanceOf(wallet1.address)).to.eq(expectedToBuyerBal1)
    })

    it('lpSwap: accept ask emits AskAccepted event', async () => {
        // open the swap
        await openSwap()
        const swapId = await lpSwap.getSwapId()

        // get the swap before accepting the ask 
        const swap = await lpSwap.getSwap(swapId)

        // wallet 1 must approve ask amount
        await tokenB1.approve(lpSwap.address, swap.ask)

        // accept the ask as wallet1
        await expect(lpSwap1.acceptAsk(swapId))
            .to.emit(lpSwap, 'AskAccepted')
            .withArgs(swapId)
    })
    
    it('lpSwap: get swap ids with no swaps opened', async () => {
        const expectedSwapIdsLength = 0
        const swapIds = await lpSwap.getSwapIds(wallet0.address)
        expect(swapIds.length).to.eq(expectedSwapIdsLength)
    })

    it('lpSwap: get swap ids with swaps opened by single address', async () => {
        const expectedSwapIds = [0, 1, 2]

        // open the swaps
        const amount0 = expandTo18Decimals(100)
        await tokenA.approve(lpSwap.address, amount0)
        await lpSwap.openSwap(tokenA.address, tokenB.address, amount0, ask)

        const amount1 = expandTo18Decimals(200)
        await tokenA.approve(lpSwap.address, amount1)
        await lpSwap.openSwap(tokenA.address, tokenB.address, amount1, ask)

        const amount2 = expandTo18Decimals(300)
        await tokenA.approve(lpSwap.address, amount2)
        await lpSwap.openSwap(tokenA.address, tokenB.address, amount2, ask)

        // check that the swaps were opened
        const swapIds = await lpSwap.getSwapIds(wallet0.address)

        expect(swapIds.length).to.eq(expectedSwapIds.length)
        
        for (let i = 0; i < swapIds.length; i++) {
            expect(swapIds[i]).to.eq(expectedSwapIds[i])
        }
    })

    it('lpSwap: get swap ids with swaps opened by multiple addresses', async () => {
        const expectedSwapIds0 = [0, 2]
        const expectedSwapIds1 = [1]

        // open the swaps
        const amount0 = expandTo18Decimals(100)
        await tokenA.approve(lpSwap.address, amount0)
        await lpSwap.openSwap(tokenA.address, tokenB.address, amount0, ask)

        // with next swap opened by wallet1
        const amount1 = expandTo18Decimals(200)

        // wallet1 must have helix lp balance to open swap
        await tokenA.transfer(wallet1.address, amount1)
        await tokenA1.approve(lpSwap.address, amount1)
        await lpSwap1.openSwap(tokenA.address, tokenB.address, amount1, ask)

        const amount2 = expandTo18Decimals(300)
        await tokenA.approve(lpSwap.address, amount2)
        await lpSwap.openSwap(tokenA.address, tokenB.address, amount2, ask)

        // check that the swaps by wallet 0 were opened
        const swapIds0 = await lpSwap.getSwapIds(wallet0.address)
        expect(swapIds0.length).to.eq(expectedSwapIds0.length)
        for (let i = 0; i < swapIds0.length; i++) {
            expect(swapIds0[i]).to.eq(expectedSwapIds0[i])
        }

        // check that the swaps by wallet 1 were opened
        const swapIds1 = await lpSwap.getSwapIds(wallet1.address)
        expect(swapIds1.length).to.eq(expectedSwapIds1.length)
        for (let i = 0; i < swapIds1.length; i++) {
            expect(swapIds1[i]).to.eq(expectedSwapIds1[i])
        }
    })

    it('lpSwap: get bid ids with no bids made', async () => {
        const expectedBidIdsLength = 0
        const bidIds = await lpSwap.getBidIds(wallet0.address)
        expect(bidIds.length).to.eq(expectedBidIdsLength)
    })

    it('lpSwap: get bid ids with bids made by single address', async () => {
        const expectedBidIds = [0, 1]

        // open the swaps
        // first swap
        const expectedSwapAmount0 = expandTo18Decimals(100)
        await tokenA.approve(lpSwap.address, expectedSwapAmount0)
        await lpSwap.openSwap(tokenA.address, tokenB.address, expectedSwapAmount0, ask)
        const swapId0 = await lpSwap.getSwapId()

        // second swap
        const expectedSwapAmount1 = expandTo18Decimals(100)
        await tokenA.approve(lpSwap.address, expectedSwapAmount1)
        await lpSwap.openSwap(tokenA.address, tokenB.address, expectedSwapAmount1, ask)
        const swapId1 = await lpSwap.getSwapId()

        // make the bids
        // first bid on swap0
        const expectedBidAmount0 = expandTo18Decimals(10)
        await tokenB1.approve(lpSwap.address, expectedBidAmount0)
        await lpSwap1.makeBid(swapId0, expectedBidAmount0)

        // second bid on swap1
        const expectedBidAmount1 = expandTo18Decimals(10)
        await tokenB1.approve(lpSwap.address, expectedBidAmount1)
        await lpSwap1.makeBid(swapId1, expectedBidAmount1)

        // get the bids
        const bidIds = await lpSwap.getBidIds(wallet1.address)

        expect(bidIds.length).to.eq(expectedBidIds.length)
        for (let i = 0; i < bidIds.length; i++) {
            expect(bidIds[i]).to.eq(expectedBidIds[i])
        }
    })

    it('lpSwap: get bid ids with bids made by multiple addresses', async () => {
        const expectedBidIds1 = [0, 2]
        const expectedBidIds2 = [1]

        // open the swaps
        // first swap
        const expectedSwapAmount0 = expandTo18Decimals(100)
        await tokenA.approve(lpSwap.address, expectedSwapAmount0)
        await lpSwap.openSwap(tokenA.address, tokenB.address, expectedSwapAmount0, ask)
        const swapId0 = await lpSwap.getSwapId()

        // second swap
        const expectedSwapAmount1 = expandTo18Decimals(100)
        await tokenA.approve(lpSwap.address, expectedSwapAmount1)
        await lpSwap.openSwap(tokenA.address, tokenB.address, expectedSwapAmount1, ask)
        const swapId1 = await lpSwap.getSwapId()

        // make the bids
        // first bid on swap0 by wallet1
        const expectedBidAmount0 = expandTo18Decimals(10)
        await tokenB1.approve(lpSwap.address, expectedBidAmount0)
        await lpSwap1.makeBid(swapId0, expectedBidAmount0)

        // second bid on swap0 by wallet2
        const expectedBidAmount1 = expandTo18Decimals(10)
        // have to transfer funds to wallet2
        await tokenB.transfer(wallet2.address, expectedBidAmount1)
        await tokenB2.approve(lpSwap.address, expectedBidAmount1)
        await lpSwap2.makeBid(swapId1, expectedBidAmount1)

        // third bid on swap1 by wallet1
        const expectedBidAmount2 = expandTo18Decimals(10)
        await tokenB1.approve(lpSwap.address, expectedBidAmount2)
        await lpSwap1.makeBid(swapId1, expectedBidAmount2)

        // get the bids ids
        const bidIds1 = await lpSwap.getBidIds(wallet1.address)
        const bidIds2 = await lpSwap.getBidIds(wallet2.address)

        // check that the bid ids are as expected
        expect(bidIds1.length).to.eq(expectedBidIds1.length)
        for (let i = 0; i < bidIds1.length; i++) {
            expect(bidIds1[i]).to.eq(expectedBidIds1[i])
        }

        expect(bidIds2.length).to.eq(expectedBidIds2.length)
        for (let i = 0; i < bidIds2.length; i++) {
            expect(bidIds2[i]).to.eq(expectedBidIds2[i])
        }
    })

    it('lpSwap: set treasury as non-owner fails', async () => {
        const treasuryAddress = wallet2.address
        await expect(lpSwap1.setTreasury(treasuryAddress))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('lpSwap: set treasury with invalid address fails', async () => {
        const invalidTreasuryAddress = constants.AddressZero
        await expect(lpSwap.setTreasury(invalidTreasuryAddress))
            .to.be.revertedWith("FeeCollector: zero address")
    })

    it('lpSwap: set treasury', async () => {
        const expectedTreasuryAddress = wallet2.address
        await lpSwap.setTreasury(expectedTreasuryAddress)
        expect(await lpSwap.treasury()).to.eq(expectedTreasuryAddress)
    })

    it('lpSwap: set treasury fee as non-owner fails', async () => {
        const fee = 0
        await expect(lpSwap1.setTreasuryPercent(fee))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('lpSwap: set treasury fee with invalid fee fails', async () => {
        const invalidFee = 101
        await expect(lpSwap.setTreasuryPercent(invalidFee))
            .to.be.revertedWith("FeeCollector: percent exceeds max")
    })

    it('lpSwap: set treasury fee', async () => {
        const expectedFee = 0
        await lpSwap.setTreasuryPercent(expectedFee)
        expect(await lpSwap.treasuryPercent()).to.eq(expectedFee)
    })

    it('lpSwap: apply treasury fee', async () => {
        const amount = 1000

        // set treasury fee to seller fee ratio at 0 : 100
        // such that seller gets 100% of the amount with no treasury fee
        const treasuryPercent0To100 = 0
        await lpSwap.setTreasuryPercent(treasuryPercent0To100)
        const expectedTreasuryAmount0To100 = 0
        const expectedSellerAmount0To100 = 1000
        const [treasuryAmount0To100, sellerAmount0To100] = await lpSwap.getTreasuryFeeSplit(amount)
        expect(treasuryAmount0To100).to.eq(expectedTreasuryAmount0To100)
        expect(sellerAmount0To100).to.eq(expectedSellerAmount0To100)

        // set treasury:seller to 33:67
        const treasuryPercent33To67 = 33
        await lpSwap.setTreasuryPercent(treasuryPercent33To67)
        const expectedTreasuryAmount33To67 = 330
        const expectedSellerAmount33To67 = 670
        const [treasuryAmount33To67, sellerAmount33To67] = await lpSwap.getTreasuryFeeSplit(amount)
        expect(treasuryAmount33To67).to.eq(expectedTreasuryAmount33To67)
        expect(sellerAmount33To67).to.eq(expectedSellerAmount33To67)

        // set treasury:seller to 100:0
        const treasuryPercent100To0 = 100
        await lpSwap.setTreasuryPercent(treasuryPercent100To0)
        const expectedTreasuryAmount100To0 = 1000
        const expectedSellerAmount100To0 = 0
        const [treasuryAmount100To0, sellerAmount100To0] = await lpSwap.getTreasuryFeeSplit(amount)
        expect(treasuryAmount100To0).to.eq(expectedTreasuryAmount100To0)
        expect(sellerAmount100To0).to.eq(expectedSellerAmount100To0)
    })

    async function openSwap() {
        // must set an allowance
        await tokenA.approve(lpSwap.address, amount)

        // open the swap
        await lpSwap.openSwap(tokenA.address, tokenB.address, amount, ask)
    }

    async function makeBid(swapId: number) {
        // must set an allowance
        await tokenB1.approve(lpSwap.address, bidAmount)
        
        // make the bid
        await lpSwap1.makeBid(swapId, bidAmount)
    }

    // return the current timestamp
    async function now() {
        return (await provider.getBlock(provider.getBlockNumber())).timestamp
    }

    // used to wait until withdraw can be called                                                                                    
    // perform dummy writes to the contract until the desired timestamp is reached
    async function waitUntil(timestamp: number) {
        // wait until timestamp is passed
        while (await now() <= timestamp) {
            await lpSwap.setTreasury(wallet0.address)
        }
    }

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
