import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

const rewardPerBlock = initials.HELIX_VAULT_REWARD_PER_BLOCK[env.network]
const bonusEndBlock = initials.HELIX_VAULT_BONUS_END_BLOCK[env.network]

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const SECONDS_PER_DAY = 86400

const verbose = true

describe('Vault', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [owner, user] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [owner])

    let vault: Contract
    let helixToken: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        vault = fullExchange.vault
        helixToken = fullExchange.helixToken

        // Fund vault with reward tokens
        await helixToken.transfer(vault.address, expandTo18Decimals(10000))

        // Approve the vault to spend caller's funds
        await helixToken.approve(vault.address, MaxUint256)
    })

    it('vault: initialized with expected values', async () => {
        expect(await vault.token()).to.eq(helixToken.address)
        expect(await vault.rewardToken()).to.eq(helixToken.address)
        expect(await vault.rewardPerBlock()).to.eq(rewardPerBlock)
        expect(await vault.bonusEndBlock()).to.eq(bonusEndBlock)

        const durations = await vault.getDurations();
   
        expect(durations[0][0]).to.eq(90 * SECONDS_PER_DAY)     // duration (n days * seconds per day)
        expect(durations[0][1]).to.eq(50)                       // weight

        expect(durations[1][0]).to.eq(180 * SECONDS_PER_DAY)
        expect(durations[1][1]).to.eq(100)

        expect(durations[2][0]).to.eq(360 * SECONDS_PER_DAY)
        expect(durations[2][1]).to.eq(300)

        expect(durations[3][0]).to.eq(540 * SECONDS_PER_DAY)
        expect(durations[3][1]).to.eq(500)

        expect(durations[4][0]).to.eq(720 * SECONDS_PER_DAY)
        expect(durations[4][1]).to.eq(1000)

        expect(await helixToken.balanceOf(vault.address)).to.eq(expandTo18Decimals(10000))
    })

    it('vault: new deposit', async () => {
        const amount = expandTo18Decimals(100)
        const durationIndex = 0
        const id = 0

        // create the new deposit
        await vault.deposit(amount, durationIndex, id); 

        // check that it was correctly created
        const depositIds = await vault.getDepositIds(owner.address)
        expect(depositIds[0]).to.eq(1)

        const expectedWeight = 50;  // 5%

        const deposit = await vault.deposits(depositIds[0])
        expect(deposit.depositor).to.eq(owner.address)
        expect(deposit.amount).to.eq(amount)
        expect(deposit.weight).to.eq(expectedWeight)
        // Don't check timestamps
        expect(deposit.rewardDebt).to.eq(await getRewardDebt(amount, expectedWeight))
        expect(deposit.withdrawn).to.be.false
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }

    async function getRewardDebt(amount: BigNumber, weight: number) {
        const accTokenPerShare = await vault.accTokenPerShare()
        const precisionFactor = await vault.PRECISION_FACTOR()
        const weightPercent = await vault.WEIGHT_PERCENT()
        return amount.mul(weight).mul(accTokenPerShare).div(precisionFactor).div(weightPercent)
    }
})
