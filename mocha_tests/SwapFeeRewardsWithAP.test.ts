import chai, { expect, use } from 'chai';
import { Contract } from 'ethers';
import { solidity, loadFixture } from 'ethereum-waffle';

import { 
    factoryFixture,
    routerFixture,
    oracleFixture,
    auraNFTFixture,
    swapFeeRewardsWithAPFixture 
} from './shared/swapFixtures';

use(solidity);

describe('SwapFeeRewardsWithAP', () => {
    let contract: Contract;

    let token1 = '0xbd95eC83bd5D4f574f540506E55EE1545adb01eD';
    let token2 = '0xA2eC19555C2d625D4BD6147609033e2b71128f37';
    let token3 = '0xffDD40B01c56Ab043038e4b4F18677193C5321E0';
    let token4 = '0x436b98aEd76BeD7B927f7718D1143f98adaC2033';

    beforeEach(async () => {
        contract = await loadFixture(swapFeeRewardsWithAPFixture);
    });

    beforeEach(async () => {
        // Add 3 tokens to contract.
        await contract.whitelistAdd(token1);
        await contract.whitelistAdd(token2);
        await contract.whitelistAdd(token3);
    });

    /*
     * WHITELIST
     */

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

    /*
     * ONLY OWNER SETTERS
     */

    it('sets factory as owner', async () => {
        const newFactory = await loadFixture(factoryFixture);
        await contract.setRouter(newFactory.address);
        expect(await contract.factory()).to.eq(newFactory.address);
    });

    it('sets router as owner', async () => {
        const newRouter = await loadFixture(routerFixture);
        await contract.setRouter(newRouter.address);
        expect(await contract.router()).to.eq(newRouter.address);
    });

    it('sets market as owner', async () => {
        const newMarket = { address: '0x946f52d986428284484d2007624ad0E88dfe6184' };
        await contract.setMarket(newMarket.address);
        expect(await contract.market()).to.eq(newMarket.address);
    });

    it('sets auction as owner', async () => {
        const newAuction = { address: '0x626Ef7da2f1365ed411630eDaa4D589F5BeD176e' };
        await contract.setAuction(newAuction.address);
        expect(await contract.auction()).to.eq(newAuction.address);
    });

    it('sets phase as owner', async () => {
        const newPhase = 2;
        await contract.setPhase(newPhase);
        expect(await contract.phase()).to.eq(2);
    });

    it('sets phaseAP as owner', async () => {
        const newPhaseAP = 3;
        await contract.setPhaseAP(newPhaseAP);
        expect(await contract.phaseAP()).to.eq(3);
    });

    it('sets oracle as owner', async () => {
        const newOracle = await loadFixture(oracleFixture);
        await contract.setOracle(newOracle.address);
        expect(await contract.oracle()).to.eq(newOracle.address);
    });

    it('sets AuraNFT as owner', async () => {
        const newAuraNFT = await loadFixture(auraNFTFixture);
        await contract.setAuraNFT(newAuraNFT.address);
        expect(await contract.auraNFT()).to.eq(newAuraNFT.address);
    });

    it('adds pair as owner', async () => {
        const newPair = {
            percentReward: 10,
            pair: '0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD'
        };

        await contract.addPair(newPair.percentReward, newPair.pair);

        const addedPair = await contract.pairsList(0);
        expect(await contract.getPairsListLength()).to.eq(1);
        expect(addedPair.pair).to.eq('0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD');
        expect(addedPair.percentReward.toNumber()).to.eq(10);
        expect(addedPair.isEnabled).to.be.true;
    });

    it('sets pair percent reward as owner', async () => {
        // Add pair and confirm addition.
        const newPair = {
            percentReward: 10,
            pair: '0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD'
        };

        await contract.addPair(newPair.percentReward, newPair.pair);

        const addedPair = await contract.pairsList(0);
        expect(await contract.getPairsListLength()).to.eq(1);
        expect(addedPair.pair).to.eq('0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD');
        expect(addedPair.percentReward.toNumber()).to.eq(10);
        expect(addedPair.isEnabled).to.be.true;

        // Set pair percent reward.
        const pairId = 0;
        const newPairReward = 11;

        await contract.setPairPercentReward(pairId, newPairReward);

        const updatedPair = await contract.pairsList(0);
        expect(await contract.getPairsListLength()).to.eq(1);
        expect(updatedPair.pair).to.eq('0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD');
        expect(updatedPair.percentReward.toNumber()).to.eq(11);
        expect(updatedPair.isEnabled).to.be.true;
    });

    it('sets pair is enabled as owner', async () => {
        // Add pair and confirm addition.
        const newPair = {
            percentReward: 10,
            pair: '0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD'
        };

        await contract.addPair(newPair.percentReward, newPair.pair);

        const addedPair = await contract.pairsList(0);
        expect(addedPair.pair).to.eq('0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD');
        expect(addedPair.percentReward.toNumber()).to.eq(10);
        expect(addedPair.isEnabled).to.be.true;

        // Set pair isEnabled.
        const pairId = 0;
        const newIsEnabled = false;

        await contract.setPairIsEnabled(pairId, newIsEnabled);

        const updatedPair = await contract.pairsList(0);
        expect(await contract.getPairsListLength()).to.eq(1);
        expect(updatedPair.pair).to.eq('0x3cf0843c147d1c9dac9b467667634cdb6e9d7dAD');
        expect(updatedPair.percentReward.toNumber()).to.eq(10);
        expect(updatedPair.isEnabled).to.be.false;
    });

    it('sets AP reward as owner', async () => {
        const newAPWagerOnSwap = 10;
        const newAPPercentMarket = 11;
        const newAPPercentAuction = 12;

        await contract.setAPReward(newAPWagerOnSwap, newAPPercentMarket, newAPPercentAuction);

        expect(await contract.apWagerOnSwap()).to.eq(10);
        expect(await contract.apPercentMarket()).to.eq(11);
        expect(await contract.apPercentAuction()).to.eq(12);
    });

});
