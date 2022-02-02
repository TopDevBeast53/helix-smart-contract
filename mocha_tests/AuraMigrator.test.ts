import { expect, use } from 'chai'; 
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle';
import { Contract } from 'legacy-ethers';
import { MaxUint256 } from 'legacy-ethers/constants';
import { BigNumber, bigNumberify } from 'legacy-ethers/utils';
import { fullExchangeFixture } from './shared/fixtures';

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
    let externalRouter: Contract;

    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader(provider, [wallet]);

    beforeEach(async () => {
        const fixture = await loadFixture(fullExchangeFixture);
        migrator = fixture.migrator;
        token0 = fixture.token0;
        token1 = fixture.token1;
        pair = fixture.pair;
        router = fixture.router;
        externalRouter = fixture.externalRouter;
    });

    it('migrator: migrate liquidity from external DEX', async () => {
        await token0.approve(externalRouter.address, MaxUint256)
        await token1.approve(externalRouter.address, MaxUint256)
        await externalRouter.addLiquidity(
            token0.address,
            token1.address,
            bigNumberify(100000),
            bigNumberify(100000),
            0,
            0,
            wallet.address,
            MaxUint256,
            overrides
        );

        const allowance = 10000000;
        await pair.approve(wallet.address, allowance);
        expect(await pair.allowance(wallet.address, wallet.address)).to.eq(allowance);

        await pair.approve(migrator.address, allowance);
        expect(await pair.allowance(wallet.address, migrator.address)).to.eq(allowance);

        const balanceOfPair = await pair.balanceOf(wallet.address);
        expect(balanceOfPair).to.eq(99000);

        // Assert that the MigrateLiquidity event is emitted.
        await expect(migrator.migrateLiquidity(
            token0.address,                 // tokenA
            token1.address,                 // tokenB
            pair.address,                   // lpToken
            externalRouter.address          // externalRouter
        ))
            .to.emit(migrator, "MigrateLiquidity")
            .withArgs(
                wallet.address,             // Migrate liquidity function caller 
                externalRouter.address,     // External DEX's router 
                99000,                      // Liquidity in external DEX
                99000,                      // Token A balance in external DEX
                99000,                      // Token B balance in external DEX
                99000,                      // Liquidity moved to DEX
                99000,                      // Token A balance moved to DEX
                99000,                      // Token B balance moved to DEX
            );
    });

    it('migrator: set the router', async () => {
        const prevRouter = await migrator.router();
        const newRouter = '0xEDAAd9a587E8887685f69a698F4929E01A6A5854';    // Arbitrary address.

        await migrator.setRouter(newRouter);

        expect(await migrator.router()).to.not.eq(prevRouter);
        expect(await migrator.router()).to.eq(newRouter);
    });
});
