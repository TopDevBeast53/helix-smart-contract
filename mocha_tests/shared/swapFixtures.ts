import { Wallet, Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { deployContract, deployMockContract } from 'ethereum-waffle';

import AuraFactory from '../../build/contracts/AuraFactory.json';
import AuraRouterV1 from '../../build/contracts/AuraRouterV1.json';
import AuraToken from '../../build/contracts/AuraToken.json'
import WETH9 from '../../build/contracts/WETH9.json';
import AuraLP from '../../build/contracts/AuraLP.json';
import AuraNFT from '../../build/contracts/AuraNFT.json';
import SwapFeeRewardsWithAP from '../../build/contracts/SwapFeeRewardsWithAP.json';
import AuraLibrary from '../../build/contracts/AuraLibrary.json';
import MockOracle from '../../build/contracts/MockOracle.json';

/*
 * NOTE:
 * This file is intended to be a temporary, minimally cluttered development space 
 * for adding the fixtures used by SwapFeeRewardsWithAP.test.ts. Once all the fixtures 
 * are in place, this file's fixtures should be merged with ./fixtures.ts so that 
 * they are available to other tests.
 */

// TODO - unify returns from `return contract;` -> `return { contract }`;

const overrides = { gasLimit: 6700000 };

export async function factoryFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides);
    return factory;
}; 

export async function routerFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const factory = await factoryFixture(provider, [wallet]);
    const weth = await deployContract(wallet, WETH9, [], overrides);
    const router = await deployContract(wallet, AuraRouterV1, [factory.address, weth.address], overrides);
    return router;
};

export async function targetTokenFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    // TODO - Confirm that the targetToken is an AuraToken.
    const targetToken = await deployContract(wallet, AuraToken, [], overrides);
    return targetToken;
};

export async function targetAPTokenFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    // TODO - This function is expecting to return an AuraPoints token. 
    //        Confirm that AuraLP == AuraPoints.
    const targetAPToken = await deployContract(wallet, AuraLP, [], overrides);
    return targetAPToken;
};

export async function oracleFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    // TODO - Replace with an actual oracle.
    const oracle = { address: '0x6F81feD0392071FA4d71d3cB018413497af7056e' };
    return oracle;
};

export async function mockOracleFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const mockOracle = await deployMockContract(wallet, MockOracle.abi);
    return mockOracle;
}

export async function auraNFTFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    // AuraNFT args: (string memory baseURI, uint initialAuraPoints, uint8 levelUpPercent).
    const auraNFT = await deployContract(wallet, AuraNFT, ["", 10000, 10], overrides);
    return auraNFT;
};

export async function auraTokenFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const auraToken = await deployContract(wallet, AuraToken, [], overrides);
    return auraToken;
};

export async function swapFeeRewardsWithAPFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const factory = await factoryFixture(provider, [wallet]);
    const router = await routerFixture(provider, [wallet]);
    const targetToken = await targetTokenFixture(provider, [wallet]);
    const targetAPToken = await targetAPTokenFixture(provider, [wallet]);
    const mockOracle = await mockOracleFixture(provider, [wallet]);
    const auraNFT = await auraNFTFixture(provider, [wallet]);
    const auraToken = await auraTokenFixture(provider, [wallet]);

    const swapFeeRewardsWithAP = await deployContract(wallet, SwapFeeRewardsWithAP, [
        factory.address,
        router.address, 
        targetToken.address,
        targetAPToken.address,
        mockOracle.address,
        auraNFT.address,
        auraToken.address,
    ], overrides);

    return {
        factory,
        router,
        targetToken,
        targetAPToken,
        mockOracle,
        auraNFT,
        auraToken,
        swapFeeRewardsWithAP
    };
};

export async function auraLibraryFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const auraLibraryFixture = await deployContract(wallet, AuraLibrary, [], overrides);
    return auraLibraryFixture;
};
