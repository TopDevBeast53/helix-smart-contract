import chai, {expect, use} from 'chai';
import { Wallet, Contract } from 'ethers';
import { Web3Provider} from 'ethers/providers';
import { solidity, loadFixture, deployContract, MockProvider } from 'ethereum-waffle';

import SwapFeeRewardsWithAP from '../build/contracts/SwapFeeRewardsWithAP.json';
import { factoryFixture, routerFixture } from './shared/swapFixtures';

use(solidity);

describe('SwapFeeRewardsWithAP', () => {
    const overrides = { gasLimit: 6700000 };
    const [wallet, walletTo] = new MockProvider().getWallets();
    let contract: Contract;

    let factory;
    let router;

    // TODO - Replace with actual contract implementations.
    //let router = '0x90BBC489677C87e26361f665ad3e26E18b063551';
    let targetToken = '0x4cfdC5Cf9659A57671DAa395AE3F043f8dFB9957';
    let targetAPToken = '0x8f593d9fb3adBDFffBFDb3212BEA73f3DA0d8d30';
    let oracle = '0xae0463B8A46aD8981FF7BD776511cEdC4c5D72f9';
    let auraNFT = '0x471105204EE017cCEaDFBC58EB6641B9cfbCad56';
    let auraToken = '0x01E822EB9643F105E4ba913098e43A5540f6953F';

    let token1 = '0xbd95eC83bd5D4f574f540506E55EE1545adb01eD';
    let token2 = '0xA2eC19555C2d625D4BD6147609033e2b71128f37';
    let token3 = '0xffDD40B01c56Ab043038e4b4F18677193C5321E0';
    let token4 = '0x436b98aEd76BeD7B927f7718D1143f98adaC2033';

    beforeEach(async () => {
        let factory = await loadFixture(factoryFixture);
        let router = await loadFixture(routerFixture);

        // Deploy new contract.
        contract = await deployContract(wallet, SwapFeeRewardsWithAP, [
            factory.address, 
            router.address, 
            targetToken, 
            targetAPToken, 
            oracle, 
            auraNFT, 
            auraToken
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
