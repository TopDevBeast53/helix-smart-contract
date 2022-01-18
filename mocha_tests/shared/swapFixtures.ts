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
