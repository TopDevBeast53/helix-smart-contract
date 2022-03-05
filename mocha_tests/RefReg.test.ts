import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

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

    const stakingRefFee = 30;
    const swapRefFee = 50;

    const newStakingRefFee = 20;
    const newSwapRefFee = 60;

    const stakeAmount = 10000;
    const swapAmount = 10000;

    let refReg: Contract
    let auraToken: Contract

    function expectedBalanceAfterStake(amount: number) {
        return amount * stakingRefFee / 1000
    }

    function expectedBalanceAfterSwap(amount: number) {
        return amount * swapRefFee / 1000
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
        expect(await refReg.stakingRefFee()).to.eq(stakingRefFee)
        expect(await refReg.swapRefFee()).to.eq(swapRefFee)
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
        await refReg.setFees(newStakingRefFee, newSwapRefFee)
        expect(await refReg.stakingRefFee()).to.eq(newStakingRefFee)
        expect(await refReg.swapRefFee()).to.eq(newSwapRefFee)
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

    it('refReg: withdraw aura to referrer succeeds', async () => {
        // add a referrer
        // we don't use referrer since we won't call withdraw as referrer
        // and we don't use referred since that would be confusing 
        // so we use owner address
        await refReg.addRef(owner.address)
    
        // store the owner's balance before withdraw so that the difference can be checked
        const prevBalance = await auraToken.balanceOf(owner.address)

        // swap so that they have a positive balance
        await refReg.recordSwapReward(owner.address, swapAmount)

        await refReg.withdraw()

        // check referrer token balance is increased
        expect(bigNumberify(await auraToken.balanceOf(owner.address)))
            .to
            .eq(bigNumberify(prevBalance).add(expectedBalanceAfterSwap(swapAmount)))

        // check referrer refReg balance is 0
        expect(await refReg.balance(owner.address)).to.eq(0)
    })
})
