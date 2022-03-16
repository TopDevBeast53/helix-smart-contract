import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'
import AuraPair from '../build/contracts/AuraPair.json'

import { fullExchangeFixture, tokensFixture } from './shared/newFixtures'
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY, createAndGetPair } from './shared/utilities'

import DeflatingERC20 from '../build/contracts/DeflatingERC20.json'
import { ecsign } from 'ethereumjs-util'

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

describe('AuraRouter', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })
    const [wallet] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet])

    let token0: Contract
    let token1: Contract
    let router: Contract
    let pair: Contract
    let swapFee: BigNumber
    let factory: Contract

    beforeEach(async function() {
        const fullExchange = await loadFixture(fullExchangeFixture)
        factory = fullExchange.factory
        router = fullExchange.router

        const tokens = await loadFixture(tokensFixture)
        const tokenA = tokens.tokenA
        const tokenB = tokens.tokenB

        const result = await createAndGetPair(provider, wallet, factory, tokenA, tokenB) 
        factory = result.factory
        token0 = result.token0
        token1 = result.token1
        pair = result.pair

        swapFee = await pair.swapFee()
    })

    it('router: prints factory init code hash', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`) 
    })

  it('router: quote', async () => {
    expect(await router.quote(bigNumberify(1), bigNumberify(100), bigNumberify(200))).to.eq(bigNumberify(2))
    expect(await router.quote(bigNumberify(2), bigNumberify(200), bigNumberify(100))).to.eq(bigNumberify(1))
    await expect(router.quote(bigNumberify(0), bigNumberify(100), bigNumberify(200))).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_AMOUNT'
    )
    await expect(router.quote(bigNumberify(1), bigNumberify(0), bigNumberify(200))).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_LIQUIDITY'
    )
    await expect(router.quote(bigNumberify(1), bigNumberify(100), bigNumberify(0))).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_LIQUIDITY'
    )
  })

  it('router: getAmountOut', async () => {
    const func = router['getAmountOut(uint256,uint256,uint256,uint256)'];
    expect(await func(bigNumberify(2), bigNumberify(100), bigNumberify(100), swapFee)).to.eq(bigNumberify(1))
    await expect(func(bigNumberify(0), bigNumberify(100), bigNumberify(100), swapFee)).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_INPUT_AMOUNT'
    )
    await expect(func(bigNumberify(2), bigNumberify(0), bigNumberify(100), swapFee)).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_LIQUIDITY'
    )
    await expect(func(bigNumberify(2), bigNumberify(100), bigNumberify(0), swapFee)).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_LIQUIDITY'
    )
  })

  it('router: getAmountIn', async () => {
    const func = router['getAmountIn(uint256,uint256,uint256,uint256)'];
    expect(await func(bigNumberify(1), bigNumberify(100), bigNumberify(100), swapFee)).to.eq(bigNumberify(2))
    await expect(func(bigNumberify(0), bigNumberify(100), bigNumberify(100), swapFee)).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_OUTPUT_AMOUNT'
    )
    await expect(func(bigNumberify(1), bigNumberify(0), bigNumberify(100), swapFee)).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_LIQUIDITY'
    )
    await expect(func(bigNumberify(1), bigNumberify(100), bigNumberify(0), swapFee)).to.be.revertedWith(
      'AuraLibrary: INSUFFICIENT_LIQUIDITY'
    )
  })

  it('router: getAmountsOut', async () => {
    await token0.approve(router.address, MaxUint256)
    await token1.approve(router.address, MaxUint256)
    const x = await router.addLiquidity(
      token0.address,
      token1.address,
      bigNumberify(2000),
      bigNumberify(2000),
      0,
      0,
      wallet.address,
      MaxUint256,
      overrides
    )

    const func = router['getAmountsOut'];
    await expect(func(bigNumberify(2), [token0.address])).to.be.revertedWith(
      'AuraLibrary: INVALID_PATH'
    )
    const path = [token0.address, token1.address]
    expect(await func(bigNumberify(2), path)).to.deep.eq([bigNumberify(2), bigNumberify(1)])
  })

  it('router: getAmountsIn', async () => {
    await token0.approve(router.address, MaxUint256)
    await token1.approve(router.address, MaxUint256)
    await router.addLiquidity(
      token0.address,
      token1.address,
      bigNumberify(10000),
      bigNumberify(10000),
      0,
      0,
      wallet.address,
      MaxUint256,
      overrides
    )

    const func = router['getAmountsIn'];
    await expect(func(bigNumberify(1), [token0.address])).to.be.revertedWith(
      'AuraLibrary: INVALID_PATH'
    )
    const path = [token0.address, token1.address]
    expect(await func(bigNumberify(1), path)).to.deep.eq([bigNumberify(2), bigNumberify(1)])
  })
})

describe('fee-on-transfer tokens', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 99999999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let DTT: Contract
  let WETH: Contract
  let router: Contract
  let pair: Contract
  beforeEach(async function() {
    const fixture = await loadFixture(fullExchangeFixture)

    WETH = fixture.WETH
    router = fixture.router

    DTT = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)])

    // make a DTT<>WETH pair
    await fixture.factory.createPair(DTT.address, WETH.address)
    const pairAddress = await fixture.factory.getPair(DTT.address, WETH.address)
    pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)
  })

  afterEach(async function() {
    expect(await provider.getBalance(router.address)).to.eq(0)
  })

  async function addLiquidity(DTTAmount: BigNumber, WETHAmount: BigNumber) {
    await DTT.approve(router.address, MaxUint256)
    await router.addLiquidityETH(DTT.address, DTTAmount, DTTAmount, WETHAmount, wallet.address, MaxUint256, {
      ...overrides,
      value: WETHAmount
    })
  }

  it('router: removeLiquidityETHSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(1)
    const ETHAmount = expandTo18Decimals(4)
    await addLiquidity(DTTAmount, ETHAmount)

    const DTTInPair = await DTT.balanceOf(pair.address)
    const WETHInPair = await WETH.balanceOf(pair.address)
    const liquidity = await pair.balanceOf(wallet.address)
    const totalSupply = await pair.totalSupply()
    const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply)
    const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply)

    await pair.approve(router.address, MaxUint256)
    await router.removeLiquidityETHSupportingFeeOnTransferTokens(
      DTT.address,
      liquidity,
      NaiveDTTExpected,
      WETHExpected,
      wallet.address,
      MaxUint256,
      overrides
    )
  })

  it('router: removeLiquidityETHWithPermitSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(1)
      .mul(100)
      .div(99)
    const ETHAmount = expandTo18Decimals(4)
    await addLiquidity(DTTAmount, ETHAmount)

    const expectedLiquidity = expandTo18Decimals(2)

    const nonce = await pair.nonces(wallet.address)
    const digest = await getApprovalDigest(
      pair,
      { owner: wallet.address, spender: router.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
      nonce,
      MaxUint256
    )
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    const DTTInPair = await DTT.balanceOf(pair.address)
    const WETHInPair = await WETH.balanceOf(pair.address)
    const liquidity = await pair.balanceOf(wallet.address)
    const totalSupply = await pair.totalSupply()
    const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply)
    const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply)

    await pair.approve(router.address, MaxUint256)
    await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      DTT.address,
      liquidity,
      NaiveDTTExpected,
      WETHExpected,
      wallet.address,
      MaxUint256,
      false,
      v,
      r,
      s,
      overrides
    )
  })

  describe('swapExactTokensForTokensSupportingFeeOnTransferTokens', () => {
    const DTTAmount = expandTo18Decimals(5)
      .mul(100)
      .div(99)
    const ETHAmount = expandTo18Decimals(10)
    const amountIn = expandTo18Decimals(1)

    beforeEach(async () => {
      await addLiquidity(DTTAmount, ETHAmount)
    })

    it('router: DTT -> WETH', async () => {
      await DTT.approve(router.address, MaxUint256)

      await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [DTT.address, WETH.address],
        wallet.address,
        MaxUint256,
        overrides
      )
    })

    // WETH -> DTT
    it('router: WETH -> DTT', async () => {
      await WETH.deposit({ value: amountIn }) // mint WETH
      await WETH.approve(router.address, MaxUint256)

      await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [WETH.address, DTT.address],
        wallet.address,
        MaxUint256,
        overrides
      )
    })
  })

  // ETH -> DTT
  it('router: swapExactETHForTokensSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(10)
      .mul(100)
      .div(99)
    const ETHAmount = expandTo18Decimals(5)
    const swapAmount = expandTo18Decimals(1)
    await addLiquidity(DTTAmount, ETHAmount)

    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [WETH.address, DTT.address],
      wallet.address,
      MaxUint256,
      {
        ...overrides,
        value: swapAmount
      }
    )
  })

  // DTT -> ETH
  it('router: swapExactTokensForETHSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(5)
      .mul(100)
      .div(99)
    const ETHAmount = expandTo18Decimals(10)
    const swapAmount = expandTo18Decimals(1)

    await addLiquidity(DTTAmount, ETHAmount)
    await DTT.approve(router.address, MaxUint256)

    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      swapAmount,
      0,
      [DTT.address, WETH.address],
      wallet.address,
      MaxUint256,
      overrides
    )
  })
})

describe('fee-on-transfer tokens: reloaded', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 99999999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let DTT: Contract
  let DTT2: Contract
  let router: Contract
  beforeEach(async function() {
    const fixture = await loadFixture(fullExchangeFixture)

    router = fixture.router

    DTT = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)])
    DTT2 = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)])

    // make a DTT<>WETH pair
    await fixture.factory.createPair(DTT.address, DTT2.address)
    const pairAddress = await fixture.factory.getPair(DTT.address, DTT2.address)
  })

  afterEach(async function() {
    expect(await provider.getBalance(router.address)).to.eq(0)
  })

  async function addLiquidity(DTTAmount: BigNumber, DTT2Amount: BigNumber) {
    await DTT.approve(router.address, MaxUint256)
    await DTT2.approve(router.address, MaxUint256)
    await router.addLiquidity(
      DTT.address,
      DTT2.address,
      DTTAmount,
      DTT2Amount,
      DTTAmount,
      DTT2Amount,
      wallet.address,
      MaxUint256,
      overrides
    )
  }

  describe('swapExactTokensForTokensSupportingFeeOnTransferTokens', () => {
    const DTTAmount = expandTo18Decimals(5)
      .mul(100)
      .div(99)
    const DTT2Amount = expandTo18Decimals(5)
    const amountIn = expandTo18Decimals(1)

    beforeEach(async () => {
      await addLiquidity(DTTAmount, DTT2Amount)
    })

    it('router: DTT -> DTT2', async () => {
      await DTT.approve(router.address, MaxUint256)

      await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [DTT.address, DTT2.address],
        wallet.address,
        MaxUint256,
        overrides
      )
    })
  })
})
