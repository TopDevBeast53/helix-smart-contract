import { Wallet } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { deployContract } from 'ethereum-waffle';

import { expandTo18Decimals } from './utilities'

import AuraFactory from '../../build/contracts/AuraFactory.json';
import AuraRouterV1 from '../../build/contracts/AuraRouterV1.json';
import AuraToken from '../../build/contracts/AuraToken.json'

/*
 * NOTE:
 * This file is intended to be a temporary, minimally cluttered development space 
 * for adding the fixtures used by SwapFeeRewardsWithAP.test.ts. Once all the fixtures 
 * are in place, this file's fixtures should be merged with ./fixtures.ts so that 
 * they are available to other tests.
 */

const overrides = { gasLimit: 6700000 };

export async function factoryFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides);
    return factory;
}; 

export async function routerFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const factory = await factoryFixture(provider, [wallet]);
    const weth = await deployContract(wallet, AuraToken, [], overrides)

    // TODO - Next line throws Out of Gas Error.
    // const router = await deployContract(wallet, AuraRouterV1, [factory.address, weth.address], overrides);
    // Temporary router until Out of Gas Error is fixed.
    const router = { address: '0x90BBC489677C87e26361f665ad3e26E18b063551' };

    return router;
};

export async function targetTokenFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const targetToken = await deployContract(wallet, AuraToken, [], overrides);
    return targetToken;
};

export async function targetAPTokenFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const targetAPToken = { address: '0x8f593d9fb3adBDFffBFDb3212BEA73f3DA0d8d30' };
    return targetAPToken;
};

export async function oracleFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const oracle = { address: '0x6F81feD0392071FA4d71d3cB018413497af7056e' };
    return oracle;
};

export async function auraNFTFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const auraNFT = { address: '0xeF2ab2ADaE2Df9df2E90E93f41e49f8558a2DF08' };
    return auraNFT;
};

export async function auraTokenFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const auraToken = { address: '0xEC4EBFc3f793EB331f7c475F61989537FeA17c83' };
    return auraToken;
};
