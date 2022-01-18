import chai, {expect, use} from 'chai';
import { Wallet, Contract } from 'ethers';
import { Web3Provider} from 'ethers/providers';
import { solidity, loadFixture, deployContract, MockProvider } from 'ethereum-waffle';

import SwapFeeRewardsWithAP from '../build/contracts/SwapFeeRewardsWithAP.json';
import { factoryFixture, routerFixture, targetTokenFixture, targetAPTokenFixture, oracleFixture, auraNFTFixture, auraTokenFixture } from './shared/swapFixtures';

use(solidity);

describe('SwapFeeRewardsWithAP', () => {
    const overrides = { gasLimit: 6700000 };
    const [wallet, walletTo] = new MockProvider().getWallets();
    let contract: Contract;

    let factory;
    let router;
    let targetToken;
    let targetAPToken;
    let oracle;
    let auraNFT;
    let auraToken;

    let token1 = '0xbd95eC83bd5D4f574f540506E55EE1545adb01eD';
    let token2 = '0xA2eC19555C2d625D4BD6147609033e2b71128f37';
    let token3 = '0xffDD40B01c56Ab043038e4b4F18677193C5321E0';
    let token4 = '0x436b98aEd76BeD7B927f7718D1143f98adaC2033';

    beforeEach(async () => {
        factory = await loadFixture(factoryFixture);
        router = await loadFixture(routerFixture);
        targetToken = await loadFixture(targetTokenFixture);
        targetAPToken = await loadFixture(targetAPTokenFixture);
        oracle = await loadFixture(oracleFixture);
        auraNFT = await loadFixture(auraNFTFixture);
        auraToken = await loadFixture(auraTokenFixture);

        // Deploy new contract.
        contract = await deployContract(wallet, SwapFeeRewardsWithAP, [
            factory.address, 
            router.address, 
            targetToken.address, 
            targetAPToken.address, 
            oracle.address, 
            auraNFT.address, 
            auraToken.address
        ], overrides);
    });

    beforeEach(async () => {
        // Add tokens to contract.
        await contract.whitelistAdd(token1);
        await contract.whitelistAdd(token2);
        await contract.whitelistAdd(token3);
    });

    it('adds tokens to whitelist', async () => {
        // Confirm that each token was added.
        expect(await contract.whitelistGet(0)).to.eq(token1);
        expect(await contract.whitelistGet(1)).to.eq(token2);
        expect(await contract.whitelistGet(2)).to.eq(token3);

        // And that the the length is correct.
        expect(await contract.whitelistLength()).to.eq(3);
    });

    it('whitelist contains only the added tokens', async () => {
        // These tokens have been added. 
        expect(await contract.whitelistContains(token1)).to.be.true;
        expect(await contract.whitelistContains(token2)).to.be.true;
        expect(await contract.whitelistContains(token3)).to.be.true;

        // This token has not been added.
        expect(await contract.whitelistContains(token4)).to.be.false;
    });

    it('removes tokens from whitelist', async () => {
        // Remove each token.
        await contract.whitelistRemove(token1);
        await contract.whitelistRemove(token2);
        await contract.whitelistRemove(token3);

        // And confirm that the length is correct.
        expect(await contract.whitelistLength()).to.eq(0);
    });
});
