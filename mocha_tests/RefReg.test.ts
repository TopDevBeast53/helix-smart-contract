import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import ReferralRegister from '../build/contracts/ReferralRegister.json'

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

describe('Referral Register: fee-on-transfer tokens', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [owner, user] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [owner])

    const referred = owner.address
    const referrer = user.address

    const stakeFee = 3
    const swapFee = 5

    const newStakeFee = 20
    const newSwapFee = 60

    const stakeAmount = 10000
    const swapAmount = 10000

    let refReg: Contract
    let helixToken: Contract

    function expectedBalanceAfterStake(amount: number) {
        return amount * stakeFee / 100
    }

    function expectedBalanceAfterSwap(amount: number) {
        return amount * swapFee / 100
    }

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        refReg = fullExchange.refReg
        helixToken = fullExchange.helixToken

        // must add the calling accounts as recorders or calls
        // or calls to record functions fail
        await refReg.addRecorder(owner.address)
    })

    it('refReg: initialized with expected values', async () => {
        expect(await refReg.helixToken()).to.eq(helixToken.address)
        expect(await refReg.stakeRewardPercent()).to.eq(stakeFee)
        expect(await refReg.swapRewardPercent()).to.eq(swapFee)
    })

    it('refReg: record staking reward withdrawal with invalid user address fails', async () => {
        const invalidUser = constants.AddressZero
        await expect(refReg.rewardStake(invalidUser, stakeAmount))
            .to.be.revertedWith("ReferralRegister: zero address")
    })

    it('refReg: record staking reward withdrawal does nothing if user is not added', async () => {
        expect(await refReg.rewards(referrer)).to.eq(0)
        await refReg.rewardStake(referred, stakeAmount)
        expect(await refReg.rewards(referrer)).to.eq(0)
    })

    it('refReg: record staking reward withdrawal succeeds', async () => {
        expect(await refReg.rewards(referrer)).to.eq(0)
    
        // add the referrer or crediting their balance will fail
        await refReg.addReferrer(referrer)

        const amount = expandTo18Decimals(100)
        await refReg.rewardStake(referred, amount)
    
        const stakeRewardPercent = await refReg.stakeRewardPercent()
        const expectedBalance = amount.mul(stakeRewardPercent).div(100)
        expect(await refReg.rewards(referrer)).to.eq(expectedBalance)
    })

    it('refReg: record staking reward withdrawal does nothing if amount is zero', async () => {
        expect(await refReg.rewards(referrer)).to.eq(0)
    
        // add the referrer or crediting their balance will fail
        await refReg.addReferrer(referrer)

        const amount = expandTo18Decimals(0)
        await refReg.rewardStake(referred, amount)
    
        const stakeRewardPercent = await refReg.stakeRewardPercent()
        const expectedBalance = amount.mul(stakeRewardPercent).div(100)
        expect(await refReg.rewards(referrer)).to.eq(expectedBalance)
    })

    it('refReg: record swap reward withdrawal with invalid user address fails', async () => {
        const invalidUser = constants.AddressZero
        await expect(refReg.rewardSwap(invalidUser, swapAmount))
            .to.be.revertedWith("ReferralRegister: zero address")
    })

    it('refReg: record swap reward does nothing if user is not added', async () => {
        expect(await refReg.rewards(referrer)).to.eq(0)
        await refReg.rewardSwap(referred, swapAmount)
        expect(await refReg.rewards(referrer)).to.eq(0)
    })

    it('refReg: record swap reward succeeds', async () => {
        expect(await refReg.rewards(referrer)).to.eq(0)
    
        // add the referrer or crediting their balance will fail
        await refReg.addReferrer(referrer)

        const amount = expandTo18Decimals(100)
        await refReg.rewardSwap(referred, amount)
    
        const swapRewardPercent = await refReg.swapRewardPercent()
        const expectedBalance = amount.mul(swapRewardPercent).div(100)
        expect(await refReg.rewards(referrer)).to.eq(expectedBalance)
    })

    it('refReg: record swap reward does nothing if amount is zero', async () => {
        expect(await refReg.rewards(referrer)).to.eq(0)
    
        // add the referrer or crediting their balance will fail
        await refReg.addReferrer(referrer)

        const amount = expandTo18Decimals(0)
        await refReg.rewardSwap(referred, amount)
    
        const swapRewardPercent = await refReg.swapRewardPercent()
        const expectedBalance = amount.mul(swapRewardPercent).div(100)
        expect(await refReg.rewards(referrer)).to.eq(expectedBalance)

    })

    it('refReg: fees can be changed', async () => {
        await refReg.setStakeRewardPercent(newStakeFee)
        await refReg.setSwapRewardPercent(newSwapFee)
        expect(await refReg.stakeRewardPercent()).to.eq(newStakeFee)
        expect(await refReg.swapRewardPercent()).to.eq(newSwapFee)
    })

    it('refReg: removes a referrer', async () => {
        // add a referrer
        await refReg.addReferrer(referrer)

        // check that they've been added
        expect(await refReg.referrers(referred)).to.eq(referrer)

        // remove the referrer
        await refReg.removeReferrer()

        expect(await refReg.referrers(referred)).to.eq(constants.AddressZero)

        // check that they've been removed
    })

    it("refReg: can't self refer", async () => {
        // the caller shouldn't be able to add themselves as a referrer
        await expect(refReg.addReferrer(referred)).to.be.revertedWith("ReferralRegister: no self referral")
    })

    it("refReg: can't record without owner permission", async () => {
        // since the user isn't a recorder, expect calls to record to fail when called by the user 
        const localRefReg = new Contract(refReg.address, JSON.stringify(ReferralRegister.abi), provider).connect(user)

        await expect(localRefReg.rewardStake(owner.address, 1000))
            .to
            .be
            .revertedWith("ReferralRegister: not a recorder")

        await expect(localRefReg.rewardSwap(owner.address, 1000))
            .to
            .be
            .revertedWith("ReferralRegister: not a recorder")
    })

    it('refReg: withdraw with nothing to withdraw fails', async () => {
        await expect(refReg.withdraw())
            .to.be.revertedWith("ReferralRegister: nothing to withdraw")
    })

    it('refReg: withdraw helix to referrer succeeds', async () => {
        // add a referrer
        await refReg.addReferrer(referrer)
    
        // have the referred make a swap so that the referrers balance is updated
        await refReg.rewardSwap(referred, swapAmount)
   
        // connect the referrer to the refReg contract so that they can call withdraw as msg.sender
        const localRefReg = new Contract(refReg.address, JSON.stringify(ReferralRegister.abi), provider).connect(user)

        // call the contract as the referrer to withdraw their balance
        await localRefReg.withdraw()

        // check referrer token balance is increased
        expect(bigNumberify(await helixToken.balanceOf(referrer))).to.eq(expectedBalanceAfterSwap(swapAmount))

        // check referrer refReg contract balance is reset to 0
        expect(await refReg.rewards(referrer)).to.eq(0)
    })
})
