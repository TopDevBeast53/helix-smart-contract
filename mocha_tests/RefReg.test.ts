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

describe('Router Swap: fee-on-transfer tokens', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [owner, user] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [owner])

    const referred = owner.address
    const referrer = user.address

    const stakeFee = 30;
    const swapFee = 50;

    const newStakeFee = 20;
    const newSwapFee = 60;

    const stakeAmount = 10000;
    const swapAmount = 10000;

    let refReg: Contract
    let auraToken: Contract

    function expectedBalanceAfterStake(amount: number) {
        return amount * stakeFee / 1000
    }

    function expectedBalanceAfterSwap(amount: number) {
        return amount * swapFee / 1000
    }

    beforeEach(async () => {
        const fixture = await loadFixture(fullExchangeFixture)
        refReg = fixture.refReg
        auraToken = fixture.auraToken

        // must add the refReg contract as an auraToken minter
        // or refReg.withdraw fails
        await auraToken.addMinter(refReg.address)
    })

    it('refReg: initialized with expected values', async () => {
        expect(await refReg.auraToken()).to.eq(auraToken.address)
        expect(await refReg.stakingRefFee()).to.eq(stakeFee)
        expect(await refReg.swapRefFee()).to.eq(swapFee)
    })

    it('refReg: record staking reward withdrawal does nothing if user is not added', async () => {
        expect(await refReg.balance(referrer)).to.eq(0)
        await refReg.recordStakingRewardWithdrawal(referred, stakeAmount);
        expect(await refReg.balance(referrer)).to.eq(0)
    })

    it('refReg: record staking reward withdrawal succeeds', async () => {
        expect(await refReg.balance(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await refReg.addRef(referrer)
        await refReg.recordStakingRewardWithdrawal(referred, stakeAmount)

        expect(await refReg.balance(referrer)).to.eq(expectedBalanceAfterStake(stakeAmount))
    })

    it('refReg: record staking reward withdrawal does nothing if amount is zero', async () => {
        expect(await refReg.balance(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await refReg.addRef(referrer)
        await refReg.recordStakingRewardWithdrawal(referred, 0)

        expect(await refReg.balance(referrer)).to.eq(expectedBalanceAfterStake(0))
    })

    it('refReg: record swap reward does nothing if user is not added', async () => {
        expect(await refReg.balance(referrer)).to.eq(0)
        await refReg.recordSwapReward(referred, swapAmount);
        expect(await refReg.balance(referrer)).to.eq(0)
    })

    it('refReg: record swap reward succeeds', async () => {
        expect(await refReg.balance(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await refReg.addRef(referrer)
        await refReg.recordSwapReward(referred, swapAmount)

        expect(await refReg.balance(referrer)).to.eq(expectedBalanceAfterSwap(swapAmount))
    })

    it('refReg: record swap reward does nothing if amount is zero', async () => {
        expect(await refReg.balance(referrer)).to.eq(0)

        // add the referrer or crediting their balance will fail
        await refReg.addRef(referrer)
        await refReg.recordSwapReward(referred, 0)

        expect(await refReg.balance(referrer)).to.eq(expectedBalanceAfterStake(0))
    })

    it('refReg: fees can be changed', async () => {
        await refReg.setFees(newStakeFee, newSwapFee)
        expect(await refReg.stakingRefFee()).to.eq(newStakeFee)
        expect(await refReg.swapRefFee()).to.eq(newSwapFee)
    })

    it('refReg: removes a referrer', async () => {
        // add a referrer
        await refReg.addRef(referrer)

        // check that they've been added
        expect(await refReg.ref(referred)).to.eq(referrer)

        // remove the referrer
        await refReg.removeRef()

        expect(await refReg.ref(referred)).to.eq(constants.AddressZero)

        // check that they've been removed
    })

    it("refReg: can't self refer", async () => {
        // the caller shouldn't be able to add themselves as a referrer
        await expect(refReg.addRef(referred)).to.be.revertedWith("Referral Register: No self referral.");
    })

    it('refReg: withdraw aura to referrer succeeds', async () => {
        // add a referrer
        await refReg.addRef(referrer)
    
        // have the referred make a swap so that the referrers balance is updated
        await refReg.recordSwapReward(referred, swapAmount)
   
        // connect the referrer to the refReg contract so that they can call withdraw as msg.sender
        const localRefReg = new Contract(refReg.address, JSON.stringify(ReferralRegister.abi), provider).connect(user)

        // call the contract as the referrer to withdraw their balance
        await localRefReg.withdraw()

        // check referrer token balance is increased
        expect(bigNumberify(await auraToken.balanceOf(referrer))).to.eq(expectedBalanceAfterSwap(swapAmount))

        // check referrer refReg contract balance is reset to 0
        expect(await refReg.balance(referrer)).to.eq(0)
    })
})
