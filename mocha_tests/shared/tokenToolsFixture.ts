import { Wallet, Contract } from 'legacy-ethers';
import { Web3Provider } from 'legacy-ethers/providers';
import { deployContract } from 'legacy-ethereum-waffle';

import { expandTo18Decimals } from './utilities';

import TokenTools from '../../build/contracts/TokenTools.json';
import TestToken from '../../build/contracts/TestToken.json';
import AuraPair from '../../build/contracts/AuraPair.json';
import AuraFactory from '../../build/contracts/AuraFactory.json';
import WETH9 from '../../build/contracts/WETH9.json'
import AuraRouterV1 from '../../build/contracts/AuraRouterV1.json';

const overrides = { 
    gasLimit: 9999999
}

interface TokenToolsFixture {
    tokenTools: Contract
    factory: Contract
    router: Contract
    pair0: Contract
    pair1: Contract
    pair2: Contract
    tokenA: Contract
    tokenB: Contract
    tokenC: Contract
    tokenD: Contract
    tokenE: Contract
    tokenF: Contract
}

export async function tokenToolsFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<TokenToolsFixture> {
    const tokenTools = await deployContract(wallet, TokenTools, [], overrides);

    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides);
    const WETH = await deployContract(wallet, WETH9, [], overrides)
    const router = await deployContract(wallet, AuraRouterV1, [factory.address, WETH.address], overrides);

    // Add the token pairs to factory.
    let token0 = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides);
    let token1 = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides);
    let token2 = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides);
    let token3 = await deployContract(wallet, TestToken, [expandTo18Decimals(10000)], overrides);
    let token4 = await deployContract(wallet, TestToken, [expandTo18Decimals(0)], overrides);
    let token5 = await deployContract(wallet, TestToken, [expandTo18Decimals(0)], overrides);

    await factory.createPair(token0.address, token1.address, overrides);
    await factory.createPair(token2.address, token3.address, overrides);
    await factory.createPair(token4.address, token5.address, overrides);

    let pairAddress = await factory.getPair(token0.address, token1.address);
    const pair0 = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet);

    pairAddress = await factory.getPair(token2.address, token3.address);
    const pair1 = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet);

    pairAddress = await factory.getPair(token4.address, token5.address);
    const pair2 = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet);

    // Reorder the pairs.
    const token0_0Address = await pair0.token0()
    const tokenA = token0.address === token0_0Address ? token0 : token1
    const tokenB = token0.address === token0_0Address ? token1 : token0

    const token0_1Address = await pair1.token0()
    const tokenC = token2.address === token0_1Address ? token2 : token3
    const tokenD = token2.address === token0_1Address ? token3 : token2

    const token0_2Address = await pair2.token0()
    const tokenE = token4.address === token0_2Address ? token4 : token5
    const tokenF = token4.address === token0_2Address ? token5 : token4

    return { tokenTools, factory, router, pair0, pair1, pair2, tokenA, tokenB, tokenC, tokenD, tokenE, tokenF };
}   
