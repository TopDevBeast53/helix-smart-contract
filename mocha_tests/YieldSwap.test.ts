import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import YieldSwap from '../build/contracts/YieldSwap.json'
import HelixToken from '../build/contracts/HelixToken.json'

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
        const allocPoint = 1000
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

        // transfer helix to wallet 1
        await helixToken.transfer(wallet1.address, balanceWallet1)
    })

    it('yieldSwap: initialized with expected values', async () => {
        expect(await yieldSwap.chef()).to.eq(chef.address)
        expect(await yieldSwap.treasury()).to.eq(wallet0.address)       // use wallet0 to make checking balance change easy
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

        expect(bid.bidder).to.eq(expectedBidder)
        expect(bid.swapId).to.eq(expectedSwapId)
        expect(bid.amount).to.eq(expectedAmount)

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

        // TODO expect the chef pool to be increased by lp amount

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

        // TODO expect the chef pool to be increased by lp amount

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

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
