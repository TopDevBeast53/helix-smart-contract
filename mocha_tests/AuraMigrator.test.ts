import { expect, use } from 'chai'; 
import { solidity, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle';
import { Contract } from 'legacy-ethers';
import { MaxUint256 } from 'legacy-ethers/constants';
import { BigNumber, bigNumberify } from 'legacy-ethers/utils';
import { fullExchangeFixture } from './shared/newFixtures';

import AuraPair from '../build/contracts/AuraPair.json'

use(solidity);

const overrides = {
    gasLimit: 99999999999
}

describe('AuraMigrator', () => {
    let migrator: Contract;
    let token0: Contract;
    let token1: Contract;
    let pair: Contract;         // Use pair as lpToken
    let router: Contract;
    let externalFactory: Contract;
    let externalRouter: Contract;
    let externalPair: Contract;

    const allowance = 10000000;
    const amountToken0 = 100000;
    const amountToken1 = 100000;
    const indexToken0 = 0;
    const indexToken1 = 1;

    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader(provider, [wallet]);

    beforeEach(async () => {
        // Load the contracts from fixture.
        const fixture = await loadFixture(fullExchangeFixture);
        const factory = fixture.factory
        migrator = fixture.migrator;
        router = fixture.router;
        externalFactory = fixture.externalFactory;
        externalRouter = fixture.externalRouter;
        const tokenA = fixture.tokenA
        const tokenB = fixture.tokenB

        await factory.createPair(tokenA.address, tokenB.address, overrides)
        const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
        pair = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

        const token0Address = (await pair.token0()).address
        token0 = tokenA.address === token0Address ? tokenB : tokenA
        token1 = tokenA.address === token0Address ? tokenA : tokenB

        // Use existing tokens 0 and 1 to add a new pair (externalPair) 
        // to the external factory.
        // wrap in try to handle pair already exists error
        await externalFactory.createPair(token0.address, token1.address);

        const externalPairAddress = await externalFactory.getPair(token0.address, token1.address);
        externalPair = new Contract(externalPairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet);
       
        // Permit the contracts to transfer large amounts of funds.
        await externalPair.approve(migrator.address, MaxUint256);
        await token0.approve(externalRouter.address, MaxUint256)
        await token1.approve(externalRouter.address, MaxUint256)

        // Seed the external router with amountToken0 and amountToken1 of staked tokens.
        await externalRouter.addLiquidity(
            token0.address,                 // address of token 0
            token1.address,                 // address of token 1
            bigNumberify(amountToken0),     // desired amount of token 0 to add
            bigNumberify(amountToken1),     // desired amount of token 1 to add
            0,                              // minimum amount of token 0 to add
            0,                              // minimum amount of token 1 to add
            wallet.address,                 // liquidity tokens recipient
            MaxUint256,                     // deadline until tx revert
            overrides                       // prevent out of gas error
        );
    });

    it('migrator: test migrate liquidity preparedness', async () => {
        expect(await token0.allowance(wallet.address, externalRouter.address)).to.eq(MaxUint256);
        expect(await token1.allowance(wallet.address, externalRouter.address)).to.eq(MaxUint256);

        expect(await externalPair.allowance(wallet.address, migrator.address)).to.eq(MaxUint256);
        expect(await externalPair.balanceOf(wallet.address)).to.eq(99000);

        expect(await pair.balanceOf(wallet.address)).to.eq(0);
    });

    it('migrator: migrate liquidity from external DEX', async () => {
        // Before migrating liquidity
        // External reserves of tokens A and B should be 100000
        expect((await externalPair.getReserves())[indexToken0]).to.eq(100000);
        expect((await externalPair.getReserves())[indexToken1]).to.eq(100000);

        // and reserves of tokens A and B should be 0.
        expect((await pair.getReserves())[indexToken0]).to.eq(0);
        expect((await pair.getReserves())[indexToken1]).to.eq(0);

        await migrator.migrateLiquidity(
            token0.address,                 // tokenA
            token1.address,                 // tokenB
            externalPair.address,           // lpToken
            externalRouter.address,         // externalRouter
            overrides                       // prevent out of gas error
        );

        // After migrating liquidity
        // External reserves of tokens A and B should be 1000
        expect((await externalPair.getReserves())[indexToken0]).to.eq(1000);
        expect((await externalPair.getReserves())[indexToken1]).to.eq(1000);

        // and reserves of tokens A and B should be 99000.
        expect((await pair.getReserves())[indexToken0]).to.eq(99000);
        expect((await pair.getReserves())[indexToken1]).to.eq(99000);
    });

    it('migrator: emits MigrateLiquidity event', async () => {
        await expect(migrator.migrateLiquidity(
            token0.address,                 // tokenA
            token1.address,                 // tokenB
            externalPair.address,           // lpToken
            externalRouter.address          // externalRouter
        ))
            .to.emit(migrator, "MigrateLiquidity")
            .withArgs(
                wallet.address,             // Migrate liquidity function caller 
                externalRouter.address,     // External DEX's router 
                99000,                      // Liquidity in external DEX
                99000,                      // Token A balance in external DEX
                99000,                      // Token B balance in external DEX
                98000,                      // Liquidity moved to DEX -- NOTE liquidity is reduced
                99000,                      // Token A balance moved to DEX
                99000,                      // Token B balance moved to DEX
            );
    });

    it('migrator: set the router', async () => {
        const prevRouter = await migrator.router();
        const newRouter = '0xEDAAd9a587E8887685f69a698F4929E01A6A5854';    // Arbitrary, non-zero address.

        await migrator.setRouter(newRouter);

        expect(await migrator.router()).to.not.eq(prevRouter);
        expect(await migrator.router()).to.eq(newRouter);
    });
});
