import {expect, use} from 'chai';
import {Contract} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
import SwapFeeRewardsWithAP from '../build/contracts/SwapFeeRewardsWithAP.json';


use(solidity);

describe('SwapFeeRewardsWithAP', () => {
    const [wallet, walletTo] = new MockProvider().getWallets();
    const overrides = { gasLimit: 5999999 };
    let _contract: Contract;
    let factory = '0x7f05920CeEC09DCF249041F39Cce7AEb43E1c621';
    let router = '0x90BBC489677C87e26361f665ad3e26E18b063551';
    let targetToken = '0x4cfdC5Cf9659A57671DAa395AE3F043f8dFB9957';
    let targetAPToken = '0x8f593d9fb3adBDFffBFDb3212BEA73f3DA0d8d30';
    let oracle = '0xae0463B8A46aD8981FF7BD776511cEdC4c5D72f9';
    let auraNFT = '0x471105204EE017cCEaDFBC58EB6641B9cfbCad56';
    let auraToken = '0x01E822EB9643F105E4ba913098e43A5540f6953F';

    beforeEach(async () => {
        _contract = await deployContract(wallet, SwapFeeRewardsWithAP, [
            factory, 
            router, 
            targetToken, 
            targetAPToken, 
            oracle, 
            auraNFT, 
            auraToken
        ], overrides);
    });

    it('CONSOLE LOG', () => {
        console.log("IT TRIGGERS");
    });
});
