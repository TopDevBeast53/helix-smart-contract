import { expect, use } from 'chai';
import { solidity, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle';
import { Contract } from 'legacy-ethers';
import { MaxUint256 } from 'legacy-ethers/constants';
import { BigNumber, bigNumberify } from 'legacy-ethers/utils';
import { fullExchangeFixture } from './shared/fixtures';
import { expandTo18Decimals } from './shared/utilities'

import HelixPair from '../build/contracts/HelixPair.json';

use(solidity);

const overrides = {
    gasLimit: 99999999999
}

describe('TokenTools', () => {
    let tokenTools: Contract;
    let factory: Contract;
    let router: Contract;
    let tokenA: Contract;
    let tokenB: Contract;
    let tokenC: Contract;
    let tokenD: Contract;
    let tokenE: Contract;
    let tokenF: Contract;
    let pair0: Contract 
    let pair1: Contract 
    let pair2: Contract 

    const amountTokenA = expandTo18Decimals(1);
    const amountTokenB = expandTo18Decimals(10);
    const amountTokenC = expandTo18Decimals(100);
    const amountTokenD = expandTo18Decimals(1000);

    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader(provider, [wallet]);

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture);
        tokenTools = fullExchange.tokenTools;
        factory = fullExchange.factory;
        router = fullExchange.router;
        tokenA = fullExchange.tokenA;
        tokenB = fullExchange.tokenB;
        tokenC = fullExchange.tokenC;
        tokenD = fullExchange.tokenD;
        tokenE = fullExchange.tokenE;
        tokenF = fullExchange.tokenF;
     
        await factory.createPair(tokenA.address, tokenB.address, overrides);
        await factory.createPair(tokenC.address, tokenD.address, overrides);
        await factory.createPair(tokenE.address, tokenF.address, overrides);
   
        pair0 = await getPair(tokenA, tokenB);
        pair1 = await getPair(tokenC, tokenD);
        pair2 = await getPair(tokenE, tokenF);

        await tokenA.approve(router.address, MaxUint256);
        await tokenB.approve(router.address, MaxUint256);
        await tokenC.approve(router.address, MaxUint256);
        await tokenD.approve(router.address, MaxUint256);
        
        await router.addLiquidity(
            tokenA.address,                 // address of token A
            tokenB.address,                 // address of token B
            amountTokenA,                   // desired amount of token A to add
            amountTokenB,                   // desired amount of token B to add
            0,                              // minimum amount of token A to add
            0,                              // minimum amount of token B to add
            wallet.address,                 // liquidity tokens recipient
            MaxUint256,                     // deadline until tx revert
            overrides                       // prevent out of gas error
        );

        await router.addLiquidity(
            tokenC.address,                 // address of token C
            tokenD.address,                 // address of token D
            amountTokenC,                   // desired amount of token C to add
            amountTokenD,                   // desired amount of token D to add
            0,                              // minimum amount of token C to add
            0,                              // minimum amount of token D to add
            wallet.address,                 // liquidity tokens recipient
            MaxUint256,                     // deadline until tx revert
            overrides                       // prevent out of gas error
        );
    });

    it('tokenTools: test allowance preparedness', async () => {
        expect(await tokenA.allowance(wallet.address, router.address)).to.eq(MaxUint256);
        expect(await tokenB.allowance(wallet.address, router.address)).to.eq(MaxUint256);
        expect(await tokenC.allowance(wallet.address, router.address)).to.eq(MaxUint256);
        expect(await tokenD.allowance(wallet.address, router.address)).to.eq(MaxUint256);
        expect(await tokenE.allowance(wallet.address, router.address)).to.eq(0);
        expect(await tokenF.allowance(wallet.address, router.address)).to.eq(0);
    });

    it('tokenTools: test pair balance preparedness', async () => {
        expect((await pair0.balanceOf(wallet.address)).toString()).to.eq('3162277660168378331')
        expect((await pair1.balanceOf(wallet.address)).toString()).to.eq('316227766016837932199')
        expect(await pair2.balanceOf(wallet.address)).to.eq(0)
    });

    it('tokenTools: gets all lp token pairs', async () => {
        const result = await tokenTools.getAllPairs(pair0.address);
        await expect(result[0]).to.eq(pair0.address);
        await expect(result[1]).to.eq(pair1.address);
        await expect(result[2]).to.eq(pair2.address);
    });

    it('tokenTools: gets the wallets staked pairs', async () => {
        const result = await tokenTools.getStakedTokenPairs(pair0.address);
        await expect(result.length).to.eq(3);
        await expect(result[0].tokenA).to.eq(tokenA.address);
        await expect(result[0].tokenB).to.eq(tokenB.address);
        await expect(result[1].tokenA).to.eq(tokenD.address);
        await expect(result[1].tokenB).to.eq(tokenC.address);
        await expect(result[2].tokenA).to.eq(tokenF.address);
        await expect(result[2].tokenB).to.eq(tokenE.address);
    });

    async function getPair(token0: Contract, token1: Contract) {
        let pairAddress = await factory.getPair(token0.address, token1.address);
        return new Contract(pairAddress, JSON.stringify(HelixPair.abi), provider).connect(wallet);
    }
});
