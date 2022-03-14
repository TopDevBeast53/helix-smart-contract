import { Wallet, Contract } from 'legacy-ethers';
import { Web3Provider } from 'legacy-ethers/providers';
import { deployContract } from 'legacy-ethereum-waffle';

import AuraFactory from '../../build/contracts/AuraFactory.json';
import AuraRouterV1 from '../../build/contracts/AuraRouterV1.json';
import AuraToken from '../../build/contracts/AuraToken.json';
import TestToken from '../../build/contracts/TestToken.json';
import WETH9 from '../../build/contracts/WETH9.json';
import AuraLP from '../../build/contracts/AuraLP.json';
import AuraNFT from '../../build/contracts/AuraNFT.json';
import SwapFeeRewardsWithAP from '../../build/contracts/SwapFeeRewardsWithAP.json';
import AuraLibrary from '../../build/contracts/AuraLibrary.json';
import Oracle from '../../build/contracts/Oracle.json';
import ReferralRegister from '../../build/contracts/ReferralRegister.json';

const overrides = { gasLimit: 6700000 };

export async function swapFeeFixture(provider: Web3Provider, [wallet]: Wallet[]) {
    const factory = await deployContract(wallet, AuraFactory, [wallet.address], overrides);
    const weth = await deployContract(wallet, WETH9, [], overrides);
    const router = await deployContract(wallet, AuraRouterV1, [factory.address, weth.address], overrides);
    const targetToken = await deployContract(wallet, AuraToken, [], overrides);
    const targetAPToken = await deployContract(wallet, TestToken, [1000000000], overrides);  // Use test token so token is BEP20 and not ERC20
    const oracle = await deployContract(wallet, Oracle, [factory.address, 2, 2], overrides);
    const auraNFT = await deployContract(wallet, AuraNFT, [], overrides);
    const auraToken = await deployContract(wallet, AuraToken, [], overrides);
    const refReg = await deployContract(wallet, ReferralRegister, [auraToken.address, 10, 10], overrides);
    const swapFee = await deployContract(wallet, SwapFeeRewardsWithAP, [
        factory.address,
        router.address,
        targetToken.address,
        targetAPToken.address,
        oracle.address,
        auraToken.address,
        auraNFT.address,
        refReg.address
    ], overrides);

    const tokenA = await deployContract(wallet, TestToken, [1000000000], overrides);
    const tokenB = await deployContract(wallet, TestToken, [1000000000], overrides);
    const tokenC = await deployContract(wallet, TestToken, [1000000000], overrides);
    const tokenD = await deployContract(wallet, TestToken, [1000000000], overrides);

    return {
        factory,
        router,
        targetToken,
        targetAPToken,
        oracle,
        refReg,
        auraNFT,
        auraToken,
        swapFee,
        tokenA,
        tokenB,
        tokenC,
        tokenD
    };
};
