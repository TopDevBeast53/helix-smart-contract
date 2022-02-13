import { expect, use } from 'chai';
import { solidity, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle';
import { Contract } from 'legacy-ethers';
import { MaxUint256 } from 'legacy-ethers/constants';
import { BigNumber, bigNumberify } from 'legacy-ethers/utils';
import { tokenToolsFixture } from './shared/tokenToolsFixture';

use(solidity);

const overrides = {
    gasLimit: 99999999999
}

describe('TokenTools', () => {
    let tokenTools: Contract;
    let factory: Contract;
    let router: Contract;
    let pair0: Contract;
    let pair1: Contract;
    let pair2: Contract;
    let tokenA: Contract;
    let tokenB: Contract;
    let tokenC: Contract;
    let tokenD: Contract;
    let tokenE: Contract;
    let tokenF: Contract;

    const amountTokenA = 100000;
    const amountTokenB = 1000000;
    const amountTokenC = 10000000;
    const amountTokenD = 100000000;

    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader(provider, [wallet]);

    beforeEach(async () => {
        // Load the contracts from fixture.
        const fixture = await loadFixture(tokenToolsFixture);
        tokenTools = fixture.tokenTools;
        factory = fixture.factory;
        router = fixture.router;
        pair0 = fixture.pair0;
        pair1 = fixture.pair1;
        pair2 = fixture.pair2;
        tokenA = fixture.tokenA;
        tokenB = fixture.tokenB;
        tokenC = fixture.tokenC;
        tokenD = fixture.tokenD;
        tokenE = fixture.tokenE;
        tokenF = fixture.tokenF;

        // Add 2 of 3 pairs to wallet.
        await tokenA.approve(router.address, MaxUint256);
        await tokenB.approve(router.address, MaxUint256);
        await tokenC.approve(router.address, MaxUint256);
        await tokenD.approve(router.address, MaxUint256);

        await router.addLiquidity(
            tokenA.address,                 // address of token A
            tokenB.address,                 // address of token B
            bigNumberify(amountTokenA),     // desired amount of token A to add
            bigNumberify(amountTokenB),     // desired amount of token B to add
            0,                              // minimum amount of token A to add
            0,                              // minimum amount of token B to add
            wallet.address,                 // liquidity tokens recipient
            MaxUint256,                     // deadline until tx revert
            overrides                       // prevent out of gas error
        );

        await router.addLiquidity(
            tokenC.address,                 // address of token C
            tokenD.address,                 // address of token D
            bigNumberify(amountTokenC),     // desired amount of token C to add
            bigNumberify(amountTokenD),     // desired amount of token D to add
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
        expect(await pair0.balanceOf(wallet.address)).to.eq(315227);
        expect(await pair1.balanceOf(wallet.address)).to.eq(31621776);
        expect(await pair2.balanceOf(wallet.address)).to.eq(0);
    });

    it('tokenTools: gets all lp token pairs', async () => {
        const result = await tokenTools.getAllPairs(pair0.address);
        await expect(result[0]).to.eq(pair0.address);
        await expect(result[1]).to.eq(pair1.address);
        await expect(result[2]).to.eq(pair2.address);
    });

    it('tokenTools: gets the wallets staked pairs', async () => {
        const result = await tokenTools.getStakedTokenPairs(pair0.address);
        await expect(result.length).to.eq(2);
        await expect(result[0].tokenA).to.eq(tokenA.address);
        await expect(result[0].tokenB).to.eq(tokenB.address);
        await expect(result[1].tokenA).to.eq(tokenC.address);
        await expect(result[1].tokenB).to.eq(tokenD.address);
    });
});
