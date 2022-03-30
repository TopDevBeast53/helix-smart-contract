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

    const [wallet0, wallet1] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    let vipPresale: Contract
    let tokenA: Contract        // input token: a stand-in for BUSD 
    let helixToken: Contract    // output token

    // Vault owned by wallet1, used for checking isOwner privileges
    let _vipPresale: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        vipPresale = fullExchange.vipPresale
        tokenA = fullExchange.tokenA
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
    })
})
