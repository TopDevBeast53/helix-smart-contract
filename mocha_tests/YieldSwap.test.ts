import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import YieldSwap from '../build/contracts/YieldSwap.json'
import HelixToken from '../build/contracts/HelixToken.json'
import HelixLP from '../build/contracts/HelixLP.json'

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const maxLockDuration = initials.YIELD_SWAP_MAX_LOCK_DURATION[env.network]

const ONE_DAY = 86400       // one day in seconds

const verbose = true

const balanceWallet1 = expandTo18Decimals(1000)

describe('Yield Swap', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [wallet0, wallet1, wallet2] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    // contracts owned by wallet0
    let helixToken: Contract
    let chef: Contract
    let helixLP: Contract
    let yieldSwap: Contract

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let yieldSwap1: Contract
    let helixToken1: Contract
    let helixLP1: Contract

    // contracts owned by wallet 2, used when wallet 2 should be msg.sender 
    let yieldSwap2: Contract
    let helixToken2: Contract

    // default arguments
    let exToken: string
    let poolId: number
    let amount: BigNumber
    let ask: BigNumber
    let bidAmount: BigNumber
    let duration: number

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        helixToken = fullExchange.helixToken
        chef = fullExchange.chef
        helixLP = fullExchange.helixLP
        yieldSwap = fullExchange.yieldSwap

        // Add the lp token to the staking pool
        const allocPoint = expandTo18Decimals(1000)
        const lpToken = helixLP.address
        const withUpdate = true
        await chef.add(allocPoint, lpToken, withUpdate)

        // set default open swap parameters
        exToken = helixToken.address
        poolId = (await chef.poolLength()) - 1
        amount = expandTo18Decimals(1000)
        ask = expandTo18Decimals(900)
        bidAmount = expandTo18Decimals(500)
        duration = ONE_DAY * 10

        // create the wallet 1 owned contracts
        yieldSwap1 = new Contract
            (
                yieldSwap.address, 
                JSON.stringify(YieldSwap.abi), 
                provider
            )
            .connect(wallet1)

        helixToken1 = new Contract
            (
                helixToken.address, 
                JSON.stringify(HelixToken.abi), 
                provider
            )
            .connect(wallet1)

        helixLP1 = new Contract
            (
                helixLP.address, 
                JSON.stringify(HelixLP.abi), 
                provider
            )
            .connect(wallet1)


        // create the wallet 2 owned contracts
        yieldSwap2 = new Contract
            (
                yieldSwap.address, 
                JSON.stringify(YieldSwap.abi), 
                provider
            )
            .connect(wallet2)

        helixToken2 = new Contract
            (
                helixToken.address, 
                JSON.stringify(HelixToken.abi), 
                provider
            )
            .connect(wallet2)

        // transfer helix to wallet 1
        await helixToken.transfer(wallet1.address, balanceWallet1)
    })

    it('yieldSwap: initialized with expected values', async () => {
        expect(await yieldSwap.chef()).to.eq(chef.address)
        expect(await yieldSwap.treasury()).to.eq(wallet0.address)           // use wallet0 to make checking balance change easy
        expect(await yieldSwap.MIN_LOCK_DURATION()).to.eq(ONE_DAY * 7)      // 1 week in seconds
        expect(await yieldSwap.MAX_LOCK_DURATION()).to.eq(ONE_DAY * 365)    // 1 year in seconds
        expect(await helixLP.balanceOf(wallet0.address)).to.eq(expandTo18Decimals(10000))
    })

    it('yieldSwap: open swap with invalid exchange token fails', async () => {
        const invalidExToken = constants.AddressZero
        await expect(yieldSwap.openSwap(invalidExToken, poolId, amount, ask, duration))
            .to.be.revertedWith("YieldSwap: INVALID EXCHANGE TOKEN ADDRESS")
    })

    it('yieldSwap: open swap with invalid amount fails', async () => {
        const invalidAmount = 0
        await expect(yieldSwap.openSwap(exToken, poolId, invalidAmount, ask, duration))
            .to.be.revertedWith("YieldSwap: AMOUNT CAN'T BE ZERO")
    })

    it('yieldSwap: open swap with invalid lock duration fails', async () => {
        const invalidDurationTooLow = ONE_DAY * 0
        await expect(yieldSwap.openSwap(exToken, poolId, amount, ask, invalidDurationTooLow))
            .to.be.revertedWith("YieldSwap: INVALID LOCK DURATION")

        const invalidDurationTooHigh = maxLockDuration + 1
        await expect(yieldSwap.openSwap(exToken, poolId, amount, ask, invalidDurationTooHigh))
            .to.be.revertedWith("YieldSwap: INVALID LOCK DURATION")
    })

    it('yieldSwap: open swap with invalid pool id fails', async () => {
        const invalidPoolId = await chef.poolLength()
        await expect(yieldSwap.openSwap(exToken, invalidPoolId, amount, ask, duration))
            .to.be.revertedWith("YieldSwap: INVALID POOL ID")
    })

    it('yieldSwap: open swap with insufficient token balance fails', async () => {
        const invalidAmount = (await helixLP.balanceOf(wallet0.address)).add(expandTo18Decimals(1))
        await expect(yieldSwap.openSwap(exToken, poolId, invalidAmount, ask, duration))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN BALANCE")
    })

    it('yieldSwap: open swap with insufficient token allowance fails', async () => {
        // No allowance given to yieldSwap
        await expect(yieldSwap.openSwap(exToken, poolId, amount, ask, duration))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN ALLOWANCE")
    })

    it('yieldSwap: open swap', async () => {
        await openSwap()

        // check that the swap was opened and values correctly set
        const swapId = await yieldSwap.getSwapId()
        const expectedSwapId = 0
        expect(swapId).to.eq(expectedSwapId)

        // get the swap
        const swap = await yieldSwap.getSwap(swapId)
        
        const expectedLpToken = helixLP.address
        const expectedExToken = exToken
        const expectedSeller = wallet0.address
        const expectedBuyer = constants.AddressZero
        const expectedPoolId = poolId
        const expectedAmount = amount
        const expectedAsk = ask
        const expectedLockUntilTimestamp = undefined
        const expectedLockDuration = duration
        const expectedIsOpen = true
        const expectedIsWithdrawn = false
    
        expect(swap.lpToken).to.eq(expectedLpToken)
        expect(swap.exToken).to.eq(expectedExToken)
        expect(swap.seller).to.eq(expectedSeller)
        expect(swap.buyer).to.eq(expectedBuyer)
        expect(swap.poolId).to.eq(expectedPoolId)
        expect(swap.amount).to.eq(expectedAmount)
        expect(swap.ask).to.eq(expectedAsk)
        expect(swap.lockUntilTimeStamp).to.eq(expectedLockUntilTimestamp)
        expect(swap.lockDuration).to.eq(expectedLockDuration)
        expect(swap.isOpen).to.eq(expectedIsOpen)
        expect(swap.isWithdrawn).to.eq(expectedIsWithdrawn)

        const expectedSwapIds = [0]
        expect((await yieldSwap.getSwapIds(wallet0.address))[0]).to.eq(expectedSwapIds[0])
    })

    it('yieldSwap: open swap emits SwapOpened event', async () => {
        // must set an allowance
        await helixLP.approve(yieldSwap.address, amount)

        // open the swap
        const expectedSwapId = 0
        await expect(yieldSwap.openSwap(exToken, poolId, amount, ask, duration))
            .to.emit(yieldSwap, 'SwapOpened')
            .withArgs(expectedSwapId)
    })

    it('yieldSwap: set ask with invalid swapId fails', async () => {
        // expect to fail because no swap opened
        const invalidSwapId0 = 0
        await expect(yieldSwap.setAsk(invalidSwapId0, ask))
            .to.be.revertedWith("YieldSwap: NO SWAP OPENED")

        // open swap
        await openSwap() 

        // expect to fail because swapId too large
        const invalidSwapId1 = (await yieldSwap.getSwapId()) + 1
        await expect(yieldSwap.setAsk(invalidSwapId1, ask))
            .to.be.revertedWith("YieldSwap: INVALID SWAP ID")
    })

    it('yieldSwap: set ask when swap is closed fails', async () => {
        await openSwap()

        // get the most recently opened swap
        const swapId = await yieldSwap.getSwapId()

        // close the swap
        await yieldSwap.closeSwap(swapId)

        // the swap is closed and setting the ask should be prohibited
        await expect(yieldSwap.setAsk(swapId, ask))
            .to.be.revertedWith("YieldSwap: SWAP IS CLOSED")
    })

    it('yieldSwap: set ask when not seller fails', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()

        // expect calling set ask as wallet 1 to fail
        await expect(yieldSwap1.setAsk(swapId, ask))
            .to.be.revertedWith("YieldSwap: ONLY SELLER CAN SET ASK")
    })

    it('yieldSwap: set ask', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()
        const expectedAsk = expandTo18Decimals(10000)
        await yieldSwap.setAsk(swapId, expectedAsk)

        expect((await yieldSwap.getSwap(swapId)).ask).to.eq(expectedAsk)
    })

    it('yieldSwap: set ask emits AskSet event', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()
        const expectedAsk = expandTo18Decimals(10000)

        await expect(yieldSwap.setAsk(swapId, expectedAsk))
            .to.emit(yieldSwap, "AskSet")
            .withArgs(swapId)
    })

    it('yieldSwap: close swap with invalid swapId fails', async () => {
        // expect to fail because no swap opened
        const invalidSwapId0 = 0
        await expect(yieldSwap.closeSwap(invalidSwapId0))
            .to.be.revertedWith("YieldSwap: NO SWAP OPENED")

        // open swap
        await openSwap() 

        // expect to fail because swapId too large
        const invalidSwapId1 = (await yieldSwap.getSwapId()) + 1
        await expect(yieldSwap.closeSwap(invalidSwapId1))
            .to.be.revertedWith("YieldSwap: INVALID SWAP ID")
    })

    it('yieldSwap: close swap when swap is closed fails', async () => {
        await openSwap()

        // get the most recently opened swap
        const swapId = await yieldSwap.getSwapId()

        // close the swap
        await yieldSwap.closeSwap(swapId)

        // the swap is closed and closing again should be prohibited
        await expect(yieldSwap.closeSwap(swapId))
            .to.be.revertedWith("YieldSwap: SWAP IS CLOSED")
    })

    it('yieldSwap: close swap when not seller fails', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()

        // expect calling set ask as wallet 1 to fail
        await expect(yieldSwap1.closeSwap(swapId))
            .to.be.revertedWith("YieldSwap: ONLY SELLER CAN CLOSE SWAP")
    })

    it('yieldSwap: close swap', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()
        const expectedIsOpen = false
        await yieldSwap.closeSwap(swapId)

        expect((await yieldSwap.getSwap(swapId)).isOpen).to.eq(expectedIsOpen)
    })

    it('yieldSwap: close swap emits SwapClosed event', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()
        const expectedIsOpen = false

        await expect(yieldSwap.closeSwap(swapId))
            .to.emit(yieldSwap, "SwapClosed")
            .withArgs(swapId)
    })

    it('yieldSwap: make bid when swap is closed fails', async () => {
        await openSwap()

        // get the most recently opened swap
        const swapId = await yieldSwap.getSwapId()

        // close the swap
        await yieldSwap.closeSwap(swapId)

        // the swap is closed and making bid should be prohibited
        await expect(yieldSwap.makeBid(swapId, bidAmount))
            .to.be.revertedWith("YieldSwap: SWAP IS CLOSED")
    })

    it('yieldSwap: make bid as seller fails', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()

        // expect making bid as seller to fail
        await expect(yieldSwap.makeBid(swapId, bidAmount))
            .to.be.revertedWith("YieldSwap: SELLER CAN'T BID ON THEIR OWN SWAP")
    })

    it('yieldSwap: make bid on same swap more than once fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        // expect making second bid on same swap to fail
        await expect(yieldSwap1.makeBid(swapId, bidAmount))
            .to.be.revertedWith("YieldSwap: CALLER HAS ALREADY MADE BID")
    })

    it('yieldSwap: make bid with no amount fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        
        // set the bid amount to 0
        bidAmount = expandTo18Decimals(0)

        // expect making second bid on same swap to fail
        await expect(yieldSwap1.makeBid(swapId, bidAmount))
            .to.be.revertedWith("YieldSwap: BID AMOUNT CAN'T BE ZERO")
    })

    it('yieldSwap: make bid with insufficient token balance fails', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()
        const invalidAmount = (await helixToken.balanceOf(wallet1.address)).add(expandTo18Decimals(1))

        await expect(yieldSwap1.makeBid(swapId, invalidAmount))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN BALANCE")
    })

    it('yieldSwap: make bid with insufficient token allowance fails', async () => {
        await openSwap()

        const swapId = await yieldSwap.getSwapId()
        const invalidAmount = (await helixToken.allowance(wallet1.address, yieldSwap.address)).add(expandTo18Decimals(1))

        await expect(yieldSwap1.makeBid(swapId, invalidAmount))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN ALLOWANCE")
    })

    it('yieldSwap: make bid', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
       
        // Check that the bid id was set
        const expectedBidId = 0
        const bidId = await yieldSwap.getBidId()
        expect(bidId).to.eq(expectedBidId)

        // Check that the bid was created
        const bid = await yieldSwap.getBid(bidId)

        const expectedBidder = wallet1.address
        const expectedSwapId = swapId
        const expectedAmount = bidAmount
        const expectedIsOpen = true

        expect(bid.bidder).to.eq(expectedBidder)
        expect(bid.swapId).to.eq(expectedSwapId)
        expect(bid.amount).to.eq(expectedAmount)
        expect(bid.isOpen).to.eq(expectedIsOpen)

        // Check that the bid was added to the swap
        const swap = await yieldSwap.getSwap(swapId)
        expect(swap.bidIds[0]).to.eq(expectedBidId)
    
        // Check that the bid was added to the buyers list of bids  
        expect((await yieldSwap.getBidIds(wallet1.address))[0]).to.eq(expectedBidId)

        // Check that the address has bid on the swap
        expect(await yieldSwap.hasBidOnSwap(wallet1.address, swapId)).to.be.true
    })

    it('yieldSwap: make bid emits BidMade event', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // must set an allowance
        await helixToken1.approve(yieldSwap.address, bidAmount)

        const expectedBidId = 0;
        
        // make the bid
        await expect(yieldSwap1.makeBid(swapId, bidAmount))
            .to.emit(yieldSwap, 'BidMade')
            .withArgs(expectedBidId)
    })

    it('yieldSwap: set bid with invalid bidId fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        const invalidBidId = (await yieldSwap.getBidId()).add(1)
        await expect(yieldSwap1.setBid(invalidBidId, bidAmount))
            .to.be.revertedWith("YieldSwap: INVALID BID ID")
    })

    it('yieldSwap: set bid when swap is closed fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
    
        // close the swap
        await yieldSwap.closeSwap(swapId)

        await expect(yieldSwap1.setBid(bidId, bidAmount))
            .to.be.revertedWith("YieldSwap: SWAP IS CLOSED")
    })

    it('yieldSwap: set bid when caller is not bidder fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
    
        // expect to fail because bid was made by wallet1
        await expect(yieldSwap.setBid(bidId, bidAmount))
            .to.be.revertedWith("YieldSwap: CALLER IS NOT THE BIDDER")
    })

    it('yieldSwap: set bid with insufficient token balance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
    
        const invalidBidAmount = balanceWallet1.add(expandTo18Decimals(1))
        await expect(yieldSwap1.setBid(bidId, invalidBidAmount))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN BALANCE")
    })

    it('yieldSwap: set bid with insufficient token allowance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
    
        const invalidBidAmount = bidAmount.add(expandTo18Decimals(1))
        await expect(yieldSwap1.setBid(bidId, invalidBidAmount))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN ALLOWANCE")
    })

    it('yieldSwap: set bid', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
    
        const expectedBidAmount = expandTo18Decimals(1)
        await yieldSwap1.setBid(bidId, expectedBidAmount)

        const bid = await yieldSwap.getBid(bidId)
        expect(bid.amount).to.eq(expectedBidAmount)
    })

    it('yieldSwap: set bid amount to zero closes bid', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
    
        const expectedBidAmount = expandTo18Decimals(0)
        const expectedIsOpen = false

        await yieldSwap1.setBid(bidId, expectedBidAmount)

        const bid = await yieldSwap.getBid(bidId)

        expect(bid.amount).to.eq(expectedBidAmount)
        expect(bid.isOpen).to.eq(expectedIsOpen)
    })

    it('yieldSwap: set bid amount to greater than zero re-opens closed bid', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
   
        // set amount to 0 to close the bid
        let expectedBidAmount = expandTo18Decimals(0)
        await yieldSwap1.setBid(bidId, expectedBidAmount)

        // get the bid to check that it's closed
        let bid = await yieldSwap.getBid(bidId)

        // bid should be closed
        expect(bid.amount).to.eq(expectedBidAmount)
        expect(bid.isOpen).to.be.false

        // set amount to greater than 0 to re-open the bid
        expectedBidAmount = expandTo18Decimals(100)
        await yieldSwap1.setBid(bidId, expectedBidAmount)

        // get the bid to check that it's opened
        bid = await yieldSwap.getBid(bidId)

        // bid should be re-opened
        expect(bid.amount).to.eq(expectedBidAmount)
        expect(bid.isOpen).to.be.true
    })

    it('yieldSwap: set bid emits BidSet event', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
        const bidId = await yieldSwap.getBidId()
    
        await expect(yieldSwap1.setBid(bidId, bidAmount))
            .to.emit(yieldSwap, 'BidSet')
            .withArgs(bidId)
    })

    it('yieldSwap: accept bid with invalid bidId fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        const invalidBidId = (await yieldSwap.getBidId()).add(1)

        // accept wallet1 bid as wallet0 with invalid bidId
        await expect(yieldSwap.acceptBid(invalidBidId))
            .to.be.revertedWith("YieldSwap: INVALID BID ID")
    })

    it('yieldSwap: accept bid as bidder fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
    
        // accept the most recent bid
        const bidId = await yieldSwap.getBidId()

        // expect accept wallet1 bid as wallet1 to fail
        await expect(yieldSwap1.acceptBid(bidId))
            .to.be.revertedWith("YieldSwap: ONLY SELLER CAN ACCEPT BID")
    })

    it('yieldSwap: accept bid when bid is closed fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
   
        // get the most recent bidId
        const bidId = await yieldSwap.getBidId()

        // close the bid as wallet1
        const closeBidAmount = 0
        await yieldSwap1.setBid(bidId, closeBidAmount)

        // get the bid
        const bid = await yieldSwap.getBid(bidId)

        // check that the bid is closed
        expect(bid.isOpen).to.be.false
    
        // expect accept bid when bid is closed to fail
        await expect(yieldSwap.acceptBid(bidId))
            .to.be.revertedWith("YieldSwap: BID IS CLOSED")
    })

    it('yieldSwap: accept bid when swap is closed fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)
   
        // close the swap
        await yieldSwap.closeSwap(swapId)

        // accept the most recent bid
        const bidId = await yieldSwap.getBidId()

        // expect accept bid when swap is closed to fail
        await expect(yieldSwap.acceptBid(bidId))
            .to.be.revertedWith("YieldSwap: SWAP IS CLOSED")
    })

    it('yieldSwap: accept bid with insufficient seller lp token balance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await yieldSwap.getBidId()

        // transfer entire wallet0 lp token balance
        await helixLP.transfer(wallet2.address, await helixLP.balanceOf(wallet0.address))

        // check that the balance of wallet 0 is empty
        expect(await helixLP.balanceOf(wallet0.address)).to.eq(0)

        // expect accept bid with no lp token balance to fail
        await expect(yieldSwap.acceptBid(bidId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN BALANCE")
    })

    it('yieldSwap: accept bid with insufficient seller lp token allowance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await yieldSwap.getBidId()

        // remove entire wallet0 lp token allowance from yield swap
        await helixLP.approve(yieldSwap.address, 0)

        // check that the allowance of yield swap is 0
        expect(await helixLP.allowance(wallet0.address, yieldSwap.address)).to.eq(0)

        // expect accept bid with no lp token allowance to fail
        await expect(yieldSwap.acceptBid(bidId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN ALLOWANCE")
    })

    it('yieldSwap: accept bid with insufficient bidder ex token balance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await yieldSwap.getBidId()

        // transfer entire wallet1 ex token balance
        await helixToken1.transfer(wallet2.address, await helixToken.balanceOf(wallet1.address))

        // check that the balance of wallet 1 is empty
        expect(await helixToken.balanceOf(wallet1.address)).to.eq(0)

        // expect accept bid with no ex token balance to fail
        await expect(yieldSwap.acceptBid(bidId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN BALANCE")
    })

    it('yieldSwap: accept bid with insufficient bidder ex token allowance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        // accept the most recent bid
        const bidId = await yieldSwap.getBidId()

        // remove entire wallet1 ex token allowance from yield swap
        await helixToken1.approve(yieldSwap.address, 0)

        // check that the allowance of yield swap is 0
        expect(await helixToken.allowance(wallet1.address, yieldSwap.address)).to.eq(0)

        // expect accept bid with no ex token allowance to fail
        await expect(yieldSwap.acceptBid(bidId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN ALLOWANCE")
    })

    it('yieldSwap: accept bid', async () => {
        // set the treasury to be wallet2 so that we can check that it receives treasury fee
        await yieldSwap.setTreasury(wallet2.address)
   
        // open the swap and make a bid
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        // get the prev balances before accepting bid to check that correct amounts transfer
        const prevExBal0 = await helixToken.balanceOf(wallet0.address)
        const prevLpBal0 = await helixLP.balanceOf(wallet0.address)
        const prevExBal1 = await helixToken.balanceOf(wallet1.address)
        const prevExBalTreasury = await helixToken.balanceOf(wallet2.address)

        // accept the bid
        const bidId = await yieldSwap.getBidId()
        await yieldSwap.acceptBid(bidId)

        // get the swap and bid
        const swap = await yieldSwap.getSwap(swapId)
        const bid = await yieldSwap.getBid(bidId)

        // expect the swap to be closed
        expect(swap.isOpen).to.be.false

        // expect the buyer to be set to the bidder
        expect(swap.buyer).to.eq(bid.bidder)

        // expect the lock timestamp to be set
        const expectedLockUntilTimestamp = swap.lockDuration.add(await now())
        expect(swap.lockUntilTimestamp).to.eq(expectedLockUntilTimestamp)

        // expect the wallet0 lp token balance to be decreased by lp amount
        const expectedLpBal0 = prevLpBal0.sub(swap.amount)
        expect(await helixLP.balanceOf(wallet0.address)).to.eq(expectedLpBal0)

        // expect the wallet1 ex token balance to be decresed by bid amount
        const expectedExBal1 = prevExBal1.sub(bid.amount)
        expect(await helixToken.balanceOf(wallet1.address)).to.eq(expectedExBal1)

        // get the fee split for seller and treasury
        const [sellerAmount, treasuryAmount]  = await yieldSwap.applySellerFee(bid.amount)

        // expect the wallet0 ex token balance to be increased by bid amount minus treasury fee
        const expectedExBal0 = prevExBal0.add(sellerAmount)
        expect(await helixToken.balanceOf(wallet0.address)).to.eq(expectedExBal0)

        // expect the treasury ex token balance to be increased by treasury fee
        const expectedExBalTreasury = prevExBalTreasury.add(treasuryAmount)
        expect(await helixToken.balanceOf(wallet2.address)).to.eq(expectedExBalTreasury)

        // expect the bid to be closed
        expect(bid.isOpen).to.be.false
    })

    it('yieldSwap: accept bid emits BidAccepted event', async () => {
        // open the swap and make a bid
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
        await makeBid(swapId)

        // accept the bid
        const bidId = await yieldSwap.getBidId()
        await expect(yieldSwap.acceptBid(bidId))
            .to.emit(yieldSwap, 'BidAccepted')
            .withArgs(bidId)
    })

    it('yieldSwap: accept ask with invalid swapId fails', async () => {
        await openSwap()
        const invalidSwapId = (await yieldSwap.getSwapId()).add(1)

        // accept wallet0 ask as wallet1 with invalid swapId
        await expect(yieldSwap1.acceptAsk(invalidSwapId))
            .to.be.revertedWith("YieldSwap: INVALID SWAP ID")
    })

    it('yieldSwap: accept ask as seller fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
    
        // expect accept wallet0 ask as wallet0 to fail
        await expect(yieldSwap.acceptAsk(swapId))
            .to.be.revertedWith("YieldSwap: SELLER CAN'T ACCEPT ASK")
    })

    it('yieldSwap: accept ask when swap is closed fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()
   
        // close the swap
        await yieldSwap.closeSwap(swapId)

        // expect accept ask as wallet1 when swap is closed to fail
        await expect(yieldSwap1.acceptAsk(swapId))
            .to.be.revertedWith("YieldSwap: SWAP IS CLOSED")
    })

    it('yieldSwap: accept ask with insufficient seller lp token balance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // transfer entire wallet0 lp token balance
        await helixLP.transfer(wallet2.address, await helixLP.balanceOf(wallet0.address))

        // check that the balance of wallet 0 is empty
        expect(await helixLP.balanceOf(wallet0.address)).to.eq(0)

        // expect accept ask as wallet1 with no wallet0 lp token balance to fail
        await expect(yieldSwap1.acceptAsk(swapId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN BALANCE")
    })

    it('yieldSwap: accept ask with insufficient seller lp token allowance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // remove entire wallet0 lp token allowance from yield swap
        await helixLP.approve(yieldSwap.address, 0)

        // check that the allowance of yield swap is 0
        expect(await helixLP.allowance(wallet0.address, yieldSwap.address)).to.eq(0)

        // expect accept ask as wallet1 with no wallet0 lp token allowance to fail
        await expect(yieldSwap1.acceptAsk(swapId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN ALLOWANCE")
    })

    it('yieldSwap: accept ask with insufficient bidder ex token balance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // transfer entire wallet1 ex token balance
        await helixToken1.transfer(wallet2.address, await helixToken.balanceOf(wallet1.address))

        // check that the balance of wallet 1 is empty
        expect(await helixToken.balanceOf(wallet1.address)).to.eq(0)

        // expect accept ask ask wallet1 with no wallet1 ex token balance to fail
        await expect(yieldSwap1.acceptAsk(swapId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN BALANCE")
    })

    it('yieldSwap: accept ask with insufficient bidder ex token allowance fails', async () => {
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // remove entire wallet1 ex token allowance from yield swap
        await helixToken1.approve(yieldSwap.address, 0)

        // check that the allowance of yield swap is 0
        expect(await helixToken.allowance(wallet1.address, yieldSwap.address)).to.eq(0)

        // expect accept ask as wallet1 with no wallet1 ex token allowance to fail
        await expect(yieldSwap1.acceptAsk(swapId))
            .to.be.revertedWith("YieldSwap: INSUFFICIENT TOKEN ALLOWANCE")
    })

    it('yieldSwap: accept ask', async () => {
        // set the treasury to be wallet2 so that we can check that it receives treasury fee
        await yieldSwap.setTreasury(wallet2.address)
   
        // open the swap and make a bid
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // get the prev balances before accepting bid to check that correct amounts transfer
        const prevExBal0 = await helixToken.balanceOf(wallet0.address)
        const prevLpBal0 = await helixLP.balanceOf(wallet0.address)
        const prevExBal1 = await helixToken.balanceOf(wallet1.address)
        const prevExBalTreasury = await helixToken.balanceOf(wallet2.address)
            
        // get the swap before accepting the ask 
        let swap = await yieldSwap.getSwap(swapId)

        // wallet 1 must approve ask amount
        await helixToken1.approve(yieldSwap.address, swap.ask)

        // accept the ask as wallet1
        await yieldSwap1.acceptAsk(swapId)

        // get the swap after accepting the ask
        swap = await yieldSwap.getSwap(swapId)

        // expect the swap to be closed
        expect(swap.isOpen).to.be.false

        // expect the buyer to be set to the accept ask caller (wallet1) 
        expect(swap.buyer).to.eq(wallet1.address)

        // expect the lock timestamp to be set
        const expectedLockUntilTimestamp = swap.lockDuration.add(await now())
        expect(swap.lockUntilTimestamp).to.eq(expectedLockUntilTimestamp)

        // expect the wallet0 lp token balance to be decreased by lp amount
        const expectedLpBal0 = prevLpBal0.sub(swap.amount)
        expect(await helixLP.balanceOf(wallet0.address)).to.eq(expectedLpBal0)

        // expect the wallet1 ex token balance to be decresed by ask amount
        const expectedExBal1 = prevExBal1.sub(swap.ask)
        expect(await helixToken.balanceOf(wallet1.address)).to.eq(expectedExBal1)

        // get the fee split for seller and treasury
        const [sellerAmount, treasuryAmount]  = await yieldSwap.applySellerFee(swap.ask)

        // expect the wallet0 ex token balance to be increased by bid amount minus treasury fee
        const expectedExBal0 = prevExBal0.add(sellerAmount)
        expect(await helixToken.balanceOf(wallet0.address)).to.eq(expectedExBal0)

        // expect the treasury ex token balance to be increased by treasury fee
        const expectedExBalTreasury = prevExBalTreasury.add(treasuryAmount)
        expect(await helixToken.balanceOf(wallet2.address)).to.eq(expectedExBalTreasury)
    })

    it('yieldSwap: accept ask emits AskAccepted event', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // get the swap before accepting the ask 
        const swap = await yieldSwap.getSwap(swapId)

        // wallet 1 must approve ask amount
        await helixToken1.approve(yieldSwap.address, swap.ask)

        // accept the ask as wallet1
        await expect(yieldSwap1.acceptAsk(swapId))
            .to.emit(yieldSwap, 'AskAccepted')
            .withArgs(swapId)
    })

    it('yieldSwap: withdraw with invalid swapId fails', async () => {
        // invalid because no swap opened
        let invalidSwapId = 0; 
        await expect(yieldSwap.withdraw(invalidSwapId))
            .to.be.revertedWith("YieldSwap: NO SWAP OPENED")

        // open the swap
        await openSwap()
        invalidSwapId = (await yieldSwap.getSwapId()).add(1)
        await expect(yieldSwap.withdraw(invalidSwapId))
            .to.be.revertedWith("YieldSwap: INVALID SWAP ID")
    })

    it('yieldSwap: withdraw when swap is open fails', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        await expect(yieldSwap.withdraw(swapId))
            .to.be.revertedWith("YieldSwap: SWAP IS OPEN")
    })

    it('yieldSwap: withdraw when swap is withdrawn fails', async () => {
        // set the min lock duration to 0 so withdraw can 
        // succeed and swap can be locked
        await yieldSwap.setMinLockDuration(0)

        // set the lock duration to 0 before opening the swap
        duration = 0

        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // get the swap before accepting the ask 
        let swap = await yieldSwap.getSwap(swapId)
    
        // check that the duration is properly set
        expect(swap.lockDuration).to.eq(0)

        // wallet 1 must approve ask amount
        await helixToken1.approve(yieldSwap.address, swap.ask)

        // accept the ask as wallet1, closing the swap and setting a buyer
        await yieldSwap1.acceptAsk(swapId)
    
        // expect the withdrawal to succeed
        await yieldSwap.withdraw(swapId)

        // expect a second withdrawal to fail
        await expect(yieldSwap.withdraw(swapId))
            .to.be.revertedWith("YieldSwap: SWAP HAS BEEN WITHDRAWN")
    })

    it('yieldSwap: withdraw when swap is open fails', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // close the swap
        await yieldSwap.closeSwap(swapId)

        await expect(yieldSwap.withdraw(swapId))
            .to.be.revertedWith("YieldSwap: SWAP HAD NO BUYER")
    })

    it('yieldSwap: withdraw when swap is locked fails', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // get the swap before accepting the ask 
        let swap = await yieldSwap.getSwap(swapId)

        // wallet 1 must approve ask amount
        await helixToken1.approve(yieldSwap.address, swap.ask)

        // accept the ask as wallet1, closing the swap and setting a buyer
        await yieldSwap1.acceptAsk(swapId)

        await expect(yieldSwap.withdraw(swapId))
            .to.be.revertedWith("YieldSwap: WITHDRAW IS LOCKED")
    })

    it('yieldSwap: withdraw', async () => {
        // set the treasury fee to 50.0% of the yield
        await yieldSwap.setBuyerFee(500)

        // set the min lock duration to 0 so withdraw can 
        // succeed and swap can be locked
        await yieldSwap.setMinLockDuration(0)

        // set the lock duration to before opening the swap
        duration = 1

        // set a large amount before opening the swap
        amount = await helixLP.balanceOf(wallet0.address)

        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // get the swap before accepting the ask 
        let swap = await yieldSwap.getSwap(swapId)
    
        // check that the duration is properly set
        expect(swap.lockDuration).to.eq(1)

        // wallet 1 must approve ask amount
        await helixToken1.approve(yieldSwap.address, swap.ask)
    
        // accept the ask as wallet1, closing the swap and setting a buyer
        await yieldSwap1.acceptAsk(swapId)

        // get the locked until timestamp
        swap = await yieldSwap.getSwap(swapId)
        const lockUntilTimestamp = swap.lockUntilTimestamp;

        // and wait until the timestamp has passed
        await waitUntil(lockUntilTimestamp)

        // get the seller (wallet0) lpToken balance after having lpTokens locked
        // used to compare after withdrawal
        const preWithdrawLpTokenBalance0 = await helixLP.balanceOf(wallet0.address)

        // get the buyer (wallet1) helixToken balance before withdrawing yield
        const preWithdrawHelixTokenBalance1 = await helixToken.balanceOf(wallet1.address)

        // make the withdrawal
        await yieldSwap.withdraw(swapId)

        // get the swap after the withdrawal
        swap = await yieldSwap.getSwap(swapId)

        // expect the swap to be marked as withdrawn
        expect(swap.isWithdrawn).to.be.true

        // expect the seller to have received their locked lpTokens during withdrawal
        const expectedLpTokenBalance0 = preWithdrawLpTokenBalance0.add(swap.amount)
        expect(await helixLP.balanceOf(wallet0.address)).to.eq(expectedLpTokenBalance0)

        // expect the buyer helixToken balance to increase
        const withdrawHelixTokenBalance1 = await helixToken.balanceOf(wallet1.address)
        expect(withdrawHelixTokenBalance1).to.be.above(preWithdrawHelixTokenBalance1)
    })

    it('yieldSwap: withdraw emits Withdrawn event', async () => {
        // set the min lock duration to 0 so withdraw can 
        // succeed and swap can be locked
        await yieldSwap.setMinLockDuration(0)

        // set the lock duration to 0 before opening the swap
        duration = 0

        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // get the swap to approve the ask
        const swap = await yieldSwap.getSwap(swapId)

        // wallet 1 must approve ask amount
        await helixToken1.approve(yieldSwap.address, swap.ask)
    
        // accept the ask as wallet1, closing the swap and setting a buyer
        await yieldSwap1.acceptAsk(swapId)

        // expect the withdrawal to emit Withdrawn
        await expect(yieldSwap.withdraw(swapId))
            .to.emit(yieldSwap, "Withdrawn")
            .withArgs(swapId)
    })

    it('yieldSwap: get max bid with invalid swap id fails', async () => {
        // invalid because no swap opened
        let invalidSwapId = 0; 
        await expect(yieldSwap.getMaxBid(invalidSwapId))
            .to.be.revertedWith("YieldSwap: NO SWAP OPENED")

        // open the swap
        await openSwap()
        invalidSwapId = (await yieldSwap.getSwapId()).add(1)
        await expect(yieldSwap.getMaxBid(invalidSwapId))
            .to.be.revertedWith("YieldSwap: INVALID SWAP ID")
    })

    it('yieldSwap: get max bid returns empty bid if no bid made', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // get the max bid
        const maxBid = await yieldSwap.getMaxBid(swapId)
    
        // expect the max bid to be empty and closed because no bid has been made
        const expectedBidder = constants.AddressZero
        const expectedSwapId = 0
        const expectedAmount = 0
        const expectedIsOpen = false

        expect(maxBid.bidder).to.eq(expectedBidder)
        expect(maxBid.swapId).to.eq(expectedSwapId)
        expect(maxBid.amount).to.eq(expectedAmount)
        expect(maxBid.isOpen).to.eq(expectedIsOpen)
    })

    it('yieldSwap: get max bid with one bid made', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // make a bid
        await makeBid(swapId)
      
        // get the bidId
        const bidId = await yieldSwap.getBidId()

        // get the expected bid
        const expectedMaxBid = await yieldSwap.getBid(bidId)

        // get the maxBid
        const maxBid = await yieldSwap.getMaxBid(swapId)
    
        // check that the obtained max bid matches the bid made
        expect(maxBid.bidder).to.eq(expectedMaxBid.bidder)
        expect(maxBid.swapId).to.eq(expectedMaxBid.swapId)
        expect(maxBid.amount).to.eq(expectedMaxBid.amount)
        expect(maxBid.isOpen).to.eq(expectedMaxBid.isOpen)
    })

    it('yieldSwap: get max bid with largest bid made first', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // make a bid as wallet 1
        const bid1 = expandTo18Decimals(200)
        await helixToken1.approve(yieldSwap.address, bid1)
        await yieldSwap1.makeBid(swapId, bid1)

        // transfer funds to wallet 2 from wallet 0
        const balanceWallet2 = expandTo18Decimals(500)
        await helixToken.transfer(wallet2.address, balanceWallet2)

        // make a bid as wallet 2 
        const bid2 = expandTo18Decimals(100)
        await helixToken2.approve(yieldSwap.address, bid2)
        await yieldSwap2.makeBid(swapId, bid2)

        // get the bidId
        const expectedBidId = 0
        const expectedMaxBid = await yieldSwap.getBid(expectedBidId)

        // get the maxBid
        const maxBid = await yieldSwap.getMaxBid(swapId)
    
        // check that the obtained max bid matches the bid made
        expect(maxBid.bidder).to.eq(expectedMaxBid.bidder)
        expect(maxBid.swapId).to.eq(expectedMaxBid.swapId)
        expect(maxBid.amount).to.eq(expectedMaxBid.amount)
        expect(maxBid.isOpen).to.eq(expectedMaxBid.isOpen)
    })

    it('yieldSwap: get max bid with largest bid made last', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // make a bid as wallet 1
        const bid1 = expandTo18Decimals(100)
        await helixToken1.approve(yieldSwap.address, bid1)
        await yieldSwap1.makeBid(swapId, bid1)

        // transfer funds to wallet 2 from wallet 0
        const balanceWallet2 = expandTo18Decimals(500)
        await helixToken.transfer(wallet2.address, balanceWallet2)

        // make a bid as wallet 2 
        const bid2 = expandTo18Decimals(200)
        await helixToken2.approve(yieldSwap.address, bid2)
        await yieldSwap2.makeBid(swapId, bid2)

        // get the bidId
        const expectedBidId = 1
        const expectedMaxBid = await yieldSwap.getBid(expectedBidId)

        // get the maxBid
        const maxBid = await yieldSwap.getMaxBid(swapId)
    
        // check that the obtained max bid matches the bid made
        expect(maxBid.bidder).to.eq(expectedMaxBid.bidder)
        expect(maxBid.swapId).to.eq(expectedMaxBid.swapId)
        expect(maxBid.amount).to.eq(expectedMaxBid.amount)
        expect(maxBid.isOpen).to.eq(expectedMaxBid.isOpen)
    })

    it('yieldSwap: get max bid with multiple largest bids', async () => {
        // open the swap
        await openSwap()
        const swapId = await yieldSwap.getSwapId()

        // make a bid as wallet 1
        const bid1 = expandTo18Decimals(200)
        await helixToken1.approve(yieldSwap.address, bid1)
        await yieldSwap1.makeBid(swapId, bid1)

        // transfer funds to wallet 2 from wallet 0
        const balanceWallet2 = expandTo18Decimals(500)
        await helixToken.transfer(wallet2.address, balanceWallet2)

        // make a bid as wallet 2 
        const bid2 = expandTo18Decimals(200)
        await helixToken2.approve(yieldSwap.address, bid2)
        await yieldSwap2.makeBid(swapId, bid2)

        // get the bidId
        const expectedBidId = 0

        // when there are tied largest bids, the winning bid should
        // be the bid made first
        const expectedMaxBid = await yieldSwap.getBid(expectedBidId)

        // get the maxBid
        const maxBid = await yieldSwap.getMaxBid(swapId)
    
        // check that the obtained max bid matches the bid made
        expect(maxBid.bidder).to.eq(expectedMaxBid.bidder)
        expect(maxBid.swapId).to.eq(expectedMaxBid.swapId)
        expect(maxBid.amount).to.eq(expectedMaxBid.amount)
        expect(maxBid.isOpen).to.eq(expectedMaxBid.isOpen)
    })

    it('yieldSwap: get swap ids with no swaps opened', async () => {
        const expectedSwapIdsLength = 0
        const swapIds = await yieldSwap.getSwapIds(wallet0.address)
        expect(swapIds.length).to.eq(expectedSwapIdsLength)
    })

    it('yieldSwap: get swap ids with swaps opened by single address', async () => {
        const expectedSwapIds = [0, 1, 2]

        // open the swaps
        const amount0 = expandTo18Decimals(100)
        await helixLP.approve(yieldSwap.address, amount0)
        await yieldSwap.openSwap(exToken, poolId, amount0, ask, duration)

        const amount1 = expandTo18Decimals(200)
        await helixLP.approve(yieldSwap.address, amount1)
        await yieldSwap.openSwap(exToken, poolId, amount1, ask, duration)

        const amount2 = expandTo18Decimals(300)
        await helixLP.approve(yieldSwap.address, amount2)
        await yieldSwap.openSwap(exToken, poolId, amount2, ask, duration)

        // check that the swaps were opened
        const swapIds = await yieldSwap.getSwapIds(wallet0.address)

        expect(swapIds.length).to.eq(expectedSwapIds.length)
        
        for (let i = 0; i < swapIds.length; i++) {
            expect(swapIds[i]).to.eq(expectedSwapIds[i])
        }
    })

    it('yieldSwap: get swap ids with swaps opened by multiple addresses', async () => {
        const expectedSwapIds0 = [0, 2]
        const expectedSwapIds1 = [1]

        // open the swaps
        const amount0 = expandTo18Decimals(100)
        await helixLP.approve(yieldSwap.address, amount0)
        await yieldSwap.openSwap(exToken, poolId, amount0, ask, duration)

        // with next swap opened by wallet1
        const amount1 = expandTo18Decimals(200)

        // wallet1 must have helix lp balance to open swap
        await helixLP.transfer(wallet1.address, amount1)
        await helixLP1.approve(yieldSwap.address, amount1)
        await yieldSwap1.openSwap(exToken, poolId, amount1, ask, duration)

        const amount2 = expandTo18Decimals(300)
        await helixLP.approve(yieldSwap.address, amount2)
        await yieldSwap.openSwap(exToken, poolId, amount2, ask, duration)

        // check that the swaps by wallet 0 were opened
        const swapIds0 = await yieldSwap.getSwapIds(wallet0.address)
        expect(swapIds0.length).to.eq(expectedSwapIds0.length)
        for (let i = 0; i < swapIds0.length; i++) {
            expect(swapIds0[i]).to.eq(expectedSwapIds0[i])
        }

        // check that the swaps by wallet 1 were opened
        const swapIds1 = await yieldSwap.getSwapIds(wallet1.address)
        expect(swapIds1.length).to.eq(expectedSwapIds1.length)
        for (let i = 0; i < swapIds1.length; i++) {
            expect(swapIds1[i]).to.eq(expectedSwapIds1[i])
        }
    })

    it('yieldSwap: get bid ids with no bids made', async () => {
        const expectedBidIdsLength = 0
        const bidIds = await yieldSwap.getBidIds(wallet0.address)
        expect(bidIds.length).to.eq(expectedBidIdsLength)
    })

    it('yieldSwap: get bid ids with bids made by single address', async () => {
        const expectedBidIds = [0, 1]

        // open the swaps
        // first swap
        const expectedSwapAmount0 = expandTo18Decimals(100)
        await helixLP.approve(yieldSwap.address, expectedSwapAmount0)
        await yieldSwap.openSwap(exToken, poolId, expectedSwapAmount0, ask, duration)
        const swapId0 = await yieldSwap.getSwapId()

        // second swap
        const expectedSwapAmount1 = expandTo18Decimals(100)
        await helixLP.approve(yieldSwap.address, expectedSwapAmount1)
        await yieldSwap.openSwap(exToken, poolId, expectedSwapAmount1, ask, duration)
        const swapId1 = await yieldSwap.getSwapId()

        // make the bids
        // first bid on swap0
        const expectedBidAmount0 = expandTo18Decimals(10)
        await helixToken1.approve(yieldSwap.address, expectedBidAmount0)
        await yieldSwap1.makeBid(swapId0, expectedBidAmount0)

        // second bid on swap1
        const expectedBidAmount1 = expandTo18Decimals(10)
        await helixToken1.approve(yieldSwap.address, expectedBidAmount1)
        await yieldSwap1.makeBid(swapId1, expectedBidAmount1)

        // get the bids
        const bidIds = await yieldSwap.getBidIds(wallet1.address)

        expect(bidIds.length).to.eq(expectedBidIds.length)
        for (let i = 0; i < bidIds.length; i++) {
            expect(bidIds[i]).to.eq(expectedBidIds[i])
        }
    })

    it('yieldSwap: get bid ids with bids made by multiple addresses', async () => {
        const expectedBidIds1 = [0, 2]
        const expectedBidIds2 = [1]

        // open the swaps
        // first swap
        const expectedSwapAmount0 = expandTo18Decimals(100)
        await helixLP.approve(yieldSwap.address, expectedSwapAmount0)
        await yieldSwap.openSwap(exToken, poolId, expectedSwapAmount0, ask, duration)
        const swapId0 = await yieldSwap.getSwapId()

        // second swap
        const expectedSwapAmount1 = expandTo18Decimals(100)
        await helixLP.approve(yieldSwap.address, expectedSwapAmount1)
        await yieldSwap.openSwap(exToken, poolId, expectedSwapAmount1, ask, duration)
        const swapId1 = await yieldSwap.getSwapId()

        // make the bids
        // first bid on swap0 by wallet1
        const expectedBidAmount0 = expandTo18Decimals(10)
        await helixToken1.approve(yieldSwap.address, expectedBidAmount0)
        await yieldSwap1.makeBid(swapId0, expectedBidAmount0)

        // second bid on swap0 by wallet2
        const expectedBidAmount1 = expandTo18Decimals(10)
        // have to transfer funds to wallet2
        await helixToken.transfer(wallet2.address, expectedBidAmount1)
        await helixToken2.approve(yieldSwap.address, expectedBidAmount1)
        await yieldSwap2.makeBid(swapId1, expectedBidAmount1)

        // third bid on swap1 by wallet1
        const expectedBidAmount2 = expandTo18Decimals(10)
        await helixToken1.approve(yieldSwap.address, expectedBidAmount2)
        await yieldSwap1.makeBid(swapId1, expectedBidAmount2)

        // get the bids ids
        const bidIds1 = await yieldSwap.getBidIds(wallet1.address)
        const bidIds2 = await yieldSwap.getBidIds(wallet2.address)

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

    it('yieldSwap: set treasury as non-owner fails', async () => {
        const treasuryAddress = wallet2.address
        await expect(yieldSwap1.setTreasury(treasuryAddress))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('yieldSwap: set treasury with invalid address fails', async () => {
        const invalidTreasuryAddress = constants.AddressZero
        await expect(yieldSwap.setTreasury(invalidTreasuryAddress))
            .to.be.revertedWith("YieldSwap: INVALID TREASURY ADDRESS")
    })

    it('yieldSwap: set treasury', async () => {
        const expectedTreasuryAddress = wallet2.address
        await yieldSwap.setTreasury(expectedTreasuryAddress)
        expect(await yieldSwap.treasury()).to.eq(expectedTreasuryAddress)
    })

    it('yieldSwap: set seller fee as non-owner fails', async () => {
        const fee = 0
        await expect(yieldSwap1.setSellerFee(fee))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('yieldSwap: set seller fee with invalid fee fails', async () => {
        const invalidFee = (await yieldSwap.MAX_FEE_PERCENT()).add(1)
        await expect(yieldSwap.setSellerFee(invalidFee))
            .to.be.revertedWith("YieldSwap: INVALID SELLER FEE")
    })

    it('yieldSwap: set seller fee', async () => {
        const expectedFee = 0
        await yieldSwap.setSellerFee(expectedFee)
        expect(await yieldSwap.sellerFee()).to.eq(expectedFee)
    })

    it('yieldSwap: set buyer fee as non-owner fails', async () => {
        const fee = 0
        await expect(yieldSwap1.setBuyerFee(fee))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('yieldSwap: set buyer fee with invalid fee fails', async () => {
        const invalidFee = (await yieldSwap.MAX_FEE_PERCENT()).add(1)
        await expect(yieldSwap.setBuyerFee(invalidFee))
            .to.be.revertedWith("YieldSwap: INVALID BUYER FEE")
    })

    it('yieldSwap: set buyer fee', async () => {
        const expectedFee = 0
        await yieldSwap.setBuyerFee(expectedFee)
        expect(await yieldSwap.sellerFee()).to.eq(expectedFee)
    })

    it('yieldSwap: apply seller fee', async () => {
        const amount = 1000

        // set treasury fee to seller fee ratio at 0 : 100
        // such that seller gets 100% of the amount with no treasury fee
        const sellerFee0To100 = 0
        await yieldSwap.setSellerFee(sellerFee0To100)
        const expectedTreasuryAmount0To100 = 0
        const expectedSellerAmount0To100 = 1000
        const [sellerAmount0To100, treasuryAmount0To100] = await yieldSwap.applySellerFee(amount)
        expect(treasuryAmount0To100).to.eq(expectedTreasuryAmount0To100)
        expect(sellerAmount0To100).to.eq(expectedSellerAmount0To100)

        // set treasury:seller to 33:67
        const sellerFee33To67 = 330
        await yieldSwap.setSellerFee(sellerFee33To67)
        const expectedTreasuryAmount33To67 = 330
        const expectedSellerAmount33To67 = 670
        const [sellerAmount33To67, treasuryAmount33To67] = await yieldSwap.applySellerFee(amount)
        expect(treasuryAmount33To67).to.eq(expectedTreasuryAmount33To67)
        expect(sellerAmount33To67).to.eq(expectedSellerAmount33To67)

        // set treasury:seller to 100:0
        const sellerFee100To0 = 1000
        await yieldSwap.setSellerFee(sellerFee100To0)
        const expectedTreasuryAmount100To0 = 1000
        const expectedSellerAmount100To0 = 0
        const [sellerAmount100To0, treasuryAmount100To0] = await yieldSwap.applySellerFee(amount)
        expect(treasuryAmount100To0).to.eq(expectedTreasuryAmount100To0)
        expect(sellerAmount100To0).to.eq(expectedSellerAmount100To0)
    })

    it('yieldSwap: apply buyer fee', async () => {
        const amount = 1000

        // set treasury fee to buyer fee ratio at 0 : 100
        // such that buyer gets 100% of the amount with no treasury fee
        const buyerFee0To100 = 0
        await yieldSwap.setBuyerFee(buyerFee0To100)
        const expectedTreasuryAmount0To100 = 0
        const expectedBuyerAmount0To100 = 1000
        const [buyerAmount0To100, treasuryAmount0To100] = await yieldSwap.applyBuyerFee(amount)
        expect(treasuryAmount0To100).to.eq(expectedTreasuryAmount0To100)
        expect(buyerAmount0To100).to.eq(expectedBuyerAmount0To100)

        // set treasury:buyer to 33:67
        const buyerFee33To67 = 330
        await yieldSwap.setBuyerFee(buyerFee33To67)
        const expectedTreasuryAmount33To67 = 330
        const expectedBuyerAmount33To67 = 670
        const [buyerAmount33To67, treasuryAmount33To67] = await yieldSwap.applyBuyerFee(amount)
        expect(treasuryAmount33To67).to.eq(expectedTreasuryAmount33To67)
        expect(buyerAmount33To67).to.eq(expectedBuyerAmount33To67)

        // set treasury:buyer to 100:0
        const buyerFee100To0 = 1000
        await yieldSwap.setBuyerFee(buyerFee100To0)
        const expectedTreasuryAmount100To0 = 1000
        const expectedBuyerAmount100To0 = 0
        const [buyerAmount100To0, treasuryAmount100To0] = await yieldSwap.applyBuyerFee(amount)
        expect(treasuryAmount100To0).to.eq(expectedTreasuryAmount100To0)
        expect(buyerAmount100To0).to.eq(expectedBuyerAmount100To0)
    })

    it('yieldSwap: set min lock duration as non-owner fails', async () => {
        const lockDuration = 0
        await expect(yieldSwap1.setMinLockDuration(lockDuration))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('yieldSwap: set min lock duration with invalid duration fails', async () => {
        const invalidLockDuration = (await yieldSwap.MAX_LOCK_DURATION()).add(1)
        await expect(yieldSwap.setMinLockDuration(invalidLockDuration))
            .to.be.revertedWith("YieldSwap: MIN LOCK DURATION MUST BE LESS THAN MAX LOCK DURATION")
    })

    it('yieldSwap: set min lock duration', async () => {
        const expectedLockDuration = 0
        await yieldSwap.setMinLockDuration(expectedLockDuration)
        expect(await yieldSwap.MIN_LOCK_DURATION()).to.eq(expectedLockDuration)
    })

    it('yieldSwap: set max lock duration as non-owner fails', async () => {
        const lockDuration = 0
        await expect(yieldSwap1.setMaxLockDuration(lockDuration))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('yieldSwap: set max lock duration with invalid duration fails', async () => {
        const invalidLockDuration = (await yieldSwap.MIN_LOCK_DURATION()).sub(1)
        await expect(yieldSwap.setMaxLockDuration(invalidLockDuration))
            .to.be.revertedWith("YieldSwap: MAX LOCK DURATION MUST BE GREATER THAN MIN LOCK DURATION")
    })

    it('yieldSwap: set max lock duration', async () => {
        const expectedLockDuration = 500000000
        await yieldSwap.setMaxLockDuration(expectedLockDuration)
        expect(await yieldSwap.MAX_LOCK_DURATION()).to.eq(expectedLockDuration)
    })

    async function openSwap() {
        // must set an allowance
        await helixLP.approve(yieldSwap.address, amount)

        // open the swap
        await yieldSwap.openSwap(exToken, poolId, amount, ask, duration)
    }

    async function makeBid(swapId: number) {
        // must set an allowance
        await helixToken1.approve(yieldSwap.address, bidAmount)
        
        // make the bid
        await yieldSwap1.makeBid(swapId, bidAmount)
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
            await yieldSwap.setTreasury(wallet0.address)
        }
    }

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
