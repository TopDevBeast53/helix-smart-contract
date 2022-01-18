import { Wallet } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { deployContract } from 'ethereum-waffle';

/*
 * NOTE:
 * This file is intended to be a temporary, minimally cluttered development space 
 * for adding the fixtures used by SwapFeeRewardsWithAP.test.ts. Once all the fixtures 
 * are in place, this file's fixtures should be merged with ./fixtures.ts so that 
 * they are available to other tests.
 */

import AuraFactory from '../../build/contracts/AuraFactory.json'

const overrides = { gasLimit: 6500000 };

export async function factoryFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides);
    return factory;
}; 
