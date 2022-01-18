import { Wallet, Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers'
import { deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

<<<<<<< HEAD
import ERC20 from '../../build/contracts/ERC20LP.json'
import AuraFactory from '../../build/contracts/AuraFactory.json'
import AuraPair from '../../build/contracts/AuraPair.json'
import AuraRouterV1 from '../../build/contracts/AuraRouterV1.json'
import TestToken from '../../build/contracts/TestToken.json'
import WETH9 from '../../build/contracts/WETH9.json'
import RouterEventEmitter from '../../build/contracts/RouterEventEmitter.json'
=======
import ERC20 from '../../build/contracts/ERC20.json'
import AuraFactory from '../../build/contracts/AuraFactory.json'
import AuraPair from '../../build/contracts/AuraPair.json'
>>>>>>> 62438999e5e03433d0539c28e774bfa142771247

interface FactoryFixture {
  factory: Contract
}

const overrides = {
  gasLimit: 9999999
}

export async function factoryFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<FactoryFixture> {
  const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides)
  return {
      factory
  }
}

interface PairFixture extends FactoryFixture {
  token0: Contract
  token1: Contract
  pair: Contract
}

export async function pairFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<PairFixture> {
  const { factory } = await factoryFixture(provider, [wallet])

  const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
  const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)

  await factory.createPair(tokenA.address, tokenB.address, overrides)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

  const token0Address = (await pair.token0()).address
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  return { factory, token0, token1, pair }
<<<<<<< HEAD
}

interface FullExchangeFixture {
  token0: Contract
  token1: Contract
  WETH: Contract
  WETHPartner: Contract
  factory: Contract
  router: Contract
  routerEventEmitter: Contract
  pair: Contract
  WETHPair: Contract
}

export async function fullExchangeFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<FullExchangeFixture> {
  // deploy tokens
  const tokenA = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)
  const tokenB = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)
  const WETH = await deployContract(wallet, WETH9, [], overrides)
  const WETHPartner = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides)

  // deploy factory
  const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides)
  // deploy router
  const router = await deployContract(wallet, AuraRouterV1, [factory.address, WETH.address], overrides)
  // event emitter for testing
  const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [], overrides)
  // initialize
  await factory.createPair(tokenA.address, tokenB.address)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

  // TODO: add migrator here once added

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  await factory.createPair(WETH.address, WETHPartner.address)
  const WETHPairAddress = await factory.getPair(WETH.address, WETHPartner.address)
  const WETHPair = new Contract(WETHPairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

  return {
      token0,
      token1,
      WETH,
      WETHPartner,
      factory,
      router,
      routerEventEmitter,
      pair,
      WETHPair
  }
=======
>>>>>>> 62438999e5e03433d0539c28e774bfa142771247
}