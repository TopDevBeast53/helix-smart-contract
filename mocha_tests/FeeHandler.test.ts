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

const minLockDuration = initials.YIELD_SWAP_MIN_LOCK_DURATION[env.network]
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
    let helixLP2: Contract
    let yieldSwap: Contract
    let tokenA: Contract
    let feeHandler: Contract

    // contracts owned by wallet 1, used when wallet 1 should be msg.sender 
    let yieldSwap1: Contract
    let helixToken1: Contract
    let helixLP1: Contract
    let helixLP21: Contract

    // contracts owned by wallet 2, used when wallet 2 should be msg.sender 
    let yieldSwap2: Contract
    let helixToken2: Contract

    // default arguments
    let toBuyerToken: string
    let toSellerToken: string
    let amount: BigNumber
    let ask: BigNumber
    let bidAmount: BigNumber
    let duration: number
    let toBuyerTokenIsLp: boolean
    let toSellerTokenIsLp: boolean

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        helixToken = fullExchange.helixToken
        chef = fullExchange.chef
        helixLP = fullExchange.helixLP
        helixLP2 = fullExchange.helixLP2
        yieldSwap = fullExchange.yieldSwap
        tokenA = fullExchange.tokenA
        feeHandler = fullExchange.feeHandler

        // Add the lp token to the staking pool
        const allocPoint = expandTo18Decimals(1000)
        const lpToken = helixLP.address
        const withUpdate = true
        await chef.add(allocPoint, lpToken, withUpdate)

        // Add the second lp token to the staking pool
        const allocPoint2 = expandTo18Decimals(1000)
        const lpToken2 = helixLP2.address
        const withUpdate2 = true
        await chef.add(allocPoint2, lpToken2, withUpdate2)

        // set default open swap parameters
        toBuyerToken = helixLP.address
        toSellerToken = helixToken.address
        amount = expandTo18Decimals(1000)
        ask = expandTo18Decimals(900)
        bidAmount = expandTo18Decimals(500)
        duration = ONE_DAY * 10
        toBuyerTokenIsLp = true
        toSellerTokenIsLp = false

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

        helixLP21 = new Contract
            (
                helixLP2.address, 
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

        // transfer helixLP to wallet 1
        await helixLP.transfer(wallet1.address, balanceWallet1)

        // transfer helixLP2 to wallet 1
        await helixLP2.transfer(wallet1.address, balanceWallet1)
    })

    it('yieldSwap: initialized with expected values', async () => {
        // Owner is set
        // Treasury is set
        // nftChef is set
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
