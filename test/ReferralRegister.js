const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { constants } = require( "legacy-ethers")
const { MaxUint256 } = require("legacy-ethers/constants")

const { expandTo18Decimals } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")

const verbose = true

describe('Referral Register: fee-on-transfer tokens', () => {
    let owner, user

    let referred
    let referrer

    const stakeFee = 3
    const swapFee = 5

    const newStakeFee = 20
    const newSwapFee = 60

    const stakeAmount = 10000
    const swapAmount = 10000

    let referralRegister
    let helixToken

    let referralRegister1

    function expectedBalanceAfterStake(amount) {
        return amount * stakeFee / 100
    }

    function expectedBalanceAfterSwap(amount) {
        return amount * swapFee / 100
    }

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners()

        referred = owner.address
        referrer = user.address

        const fullExchange = await loadFixture(fullExchangeFixture)
        referralRegister = fullExchange.referralRegister
        helixToken = fullExchange.helixToken

        referralRegister1 = await referralRegister.connect(user) 

        // must add the calling accounts as recorders or calls
        // or calls to record functions fail
        await referralRegister.addRecorder(owner.address)
    })

    it('referralRegister: initialized with expected values', async () => {
        expect(await referralRegister.helixToken()).to.eq(helixToken.address)
        expect(await referralRegister.stakeRewardPercent()).to.eq(stakeFee)
        expect(await referralRegister.swapRewardPercent()).to.eq(swapFee)
    })

    it('referralRegister: record staking reward withdrawal with invalid user address fails', async () => {
        const invalidUser = constants.AddressZero
        await expect(referralRegister.rewardStake(invalidUser, stakeAmount))
            .to.be.revertedWith("ZeroAddress()")
    })

    it('referralRegister: record staking reward withdrawal does nothing if user is not added', async () => {
        expect(await referralRegister.rewards(referrer)).to.eq(0)
        await referralRegister.rewardStake(referred, stakeAmount)
        expect(await referralRegister.rewards(referrer)).to.eq(0)
    })

    it('referralRegister: record staking reward withdrawal succeeds', async () => {
        expect(await referralRegister.rewards(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await referralRegister.addReferrer(referrer)

        const amount = expandTo18Decimals(100)
        await referralRegister.rewardStake(referred, amount)

        const stakeRewardPercent = await referralRegister.stakeRewardPercent()
        const expectedBalance = amount.mul(stakeRewardPercent).div(100)
        expect(await referralRegister.rewards(referrer)).to.eq(expectedBalance)
    })

    it('referralRegister: record staking reward withdrawal does nothing if amount is zero', async () => {
        expect(await referralRegister.rewards(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await referralRegister.addReferrer(referrer)

        const amount = expandTo18Decimals(0)
        await referralRegister.rewardStake(referred, amount)

        const stakeRewardPercent = await referralRegister.stakeRewardPercent()
        const expectedBalance = amount.mul(stakeRewardPercent).div(100)
        expect(await referralRegister.rewards(referrer)).to.eq(expectedBalance)
    })

    it('referralRegister: record swap reward withdrawal with invalid user address fails', async () => {
        const invalidUser = constants.AddressZero
        await expect(referralRegister.rewardSwap(invalidUser, swapAmount))
            .to.be.revertedWith("ZeroAddress()")
    })

    it('referralRegister: record swap reward does nothing if user is not added', async () => {
        expect(await referralRegister.rewards(referrer)).to.eq(0)
        await referralRegister.rewardSwap(referred, swapAmount)
        expect(await referralRegister.rewards(referrer)).to.eq(0)
    })

    it('referralRegister: record swap reward succeeds', async () => {
        expect(await referralRegister.rewards(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await referralRegister.addReferrer(referrer)

        const amount = expandTo18Decimals(100)
        await referralRegister.rewardSwap(referred, amount)

        const swapRewardPercent = await referralRegister.swapRewardPercent()
        const expectedBalance = amount.mul(swapRewardPercent).div(100)
        expect(await referralRegister.rewards(referrer)).to.eq(expectedBalance)
    })

    it('referralRegister: record swap reward does nothing if amount is zero', async () => {
        expect(await referralRegister.rewards(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await referralRegister.addReferrer(referrer)

        const amount = expandTo18Decimals(0)
        await referralRegister.rewardSwap(referred, amount)

        const swapRewardPercent = await referralRegister.swapRewardPercent()
        const expectedBalance = amount.mul(swapRewardPercent).div(100)
        expect(await referralRegister.rewards(referrer)).to.eq(expectedBalance)

    })

    it('referralRegister: fees can be changed', async () => {
        await referralRegister.setStakeRewardPercent(newStakeFee)
        await referralRegister.setSwapRewardPercent(newSwapFee)
        expect(await referralRegister.stakeRewardPercent()).to.eq(newStakeFee)
        expect(await referralRegister.swapRewardPercent()).to.eq(newSwapFee)
    })

    it('referralRegister: removes a referrer', async () => {
        // add a referrer
        await referralRegister.addReferrer(referrer)

        // check that they've been added
        expect(await referralRegister.referrers(referred)).to.eq(referrer)

        // remove the referrer
        await referralRegister.removeReferrer()

        expect(await referralRegister.referrers(referred)).to.eq(constants.AddressZero)

        // check that they've been removed
    })

    it("referralRegister: can't self refer", async () => {
        // the caller shouldn't be able to add themselves as a referrer
        await expect(referralRegister.addReferrer(referred))
            .to.be.revertedWith("NoSelfReferral()")
    })

    it("referralRegister: can't record without owner permission", async () => {
        await expect(referralRegister1.rewardStake(owner.address, 1000))
            .to
            .be
            .revertedWith(`NotRecorder(\"${user.address}\")`)

        await expect(referralRegister1.rewardSwap(owner.address, 1000))
            .to
            .be
            .revertedWith(`NotRecorder(\"${user.address}\")`)
    })

    it('referralRegister: withdraw with nothing to withdraw fails', async () => {
        await expect(referralRegister.withdraw())
            .to.be.revertedWith("NoRewardBalance()")
    })

    it('referralRegister: withdraw helix to referrer succeeds', async () => {
        // add a referrer
        await referralRegister.addReferrer(referrer)
    
        // confirm that the referrer is added
        expect(await referralRegister.referrers(owner.address)).to.eq(referrer)

        // transfer helix to register so that it has balance to withdraw
        await helixToken.transfer(referralRegister.address, expandTo18Decimals(1000))

        // have the referred make a swap so that the referrers balance is updated
        await referralRegister.rewardSwap(referred, swapAmount)

        // call the contract as the referrer to withdraw their balance
        await referralRegister1.withdraw()

        // check referrer token balance is increased
        expect((await helixToken.balanceOf(referrer)).toString())
            .to.eq(expectedBalanceAfterSwap(swapAmount).toString())

        // check referrer referralRegister contract balance is reset to 0
        expect(await referralRegister.rewards(referrer)).to.eq(0)
    })
})
