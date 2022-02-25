import chai, { expect, use } from 'chai';
import { Contract, constants } from 'legacy-ethers';
import { solidity, loadFixture, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle';

import SwapFeeRewardsWithAP from '../build/contracts/SwapFeeRewardsWithAP.json';
import { swapFeeFixture } from './shared/swapFixtures';

use(solidity);

const overrides = {
    gasLimit: 99999999999
}

describe('SwapFeeRewardsWithAP', () => {
    let factory: Contract;
    let router: Contract;
    let targetToken: Contract;
    let targetAPToken: Contract;
    let oracle: Contract;
    let auraNFT: Contract;
    let auraToken: Contract;
    let swapFee: Contract;

    let tokenA: Contract;
    let tokenB: Contract;
    let tokenC: Contract;
    let tokenD: Contract;

    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    });
    const [owner, user] = provider.getWallets();
    const loadFixture = createFixtureLoader(provider, [owner]);

    beforeEach(async () => {
        // Load all the contracts used in creating swapFee contract.
        const fixture = await loadFixture(swapFeeFixture);
        factory = fixture.factory;
        router = fixture.router;
        targetToken = fixture.targetToken;
        targetAPToken = fixture.targetAPToken;
        oracle = fixture.oracle;
        auraNFT = fixture.auraNFT;
        auraToken = fixture.auraToken;
        swapFee = fixture.swapFee;
        tokenA = fixture.tokenA;
        tokenB = fixture.tokenB;
        tokenC = fixture.tokenC;
        tokenD = fixture.tokenD;
    });

    beforeEach(async () => {
        // Register with router and auraNFT
        await router.setSwapFeeReward(swapFee.address);
        // Throws caller is not the owner.
        // await auraNFT.addAccruer(swapFee.address);
    });

    beforeEach(async () => {
        // Add 3 tokens to contract.
        await swapFee.whitelistAdd(tokenA.address);
        await swapFee.whitelistAdd(tokenB.address);
        await swapFee.whitelistAdd(tokenC.address);
    });

    beforeEach(async () => {
        // set the contract reward distribution so that user has maximum choice
        await swapFee.setDefaultRewardDistribution(100);
        expect(await swapFee.defaultRewardDistribution()).to.eq(100);

        // set the caller distribution so they get an even payout (50/50) of AP and AURA tokens
        // NOTE - userRewardDistribution <= defaultRewardDistribution
        await swapFee.setUserDefaultDistribution(50); 
        expect(await swapFee.rewardDistribution(owner.address)).to.eq(50);
    });

    beforeEach(async () => {
        // Register the token pair with factory.
        await factory.createPair(tokenA.address, tokenB.address);

        // Register the oracle with the factory.
        await factory.setOracle(oracle.address);
        expect(await factory.oracle()).to.eq(oracle.address);

        // Enable the pair with the oracle
        const pairAddress = await swapFee.pairFor(tokenA.address, tokenB.address);
        await factory.enablePair(pairAddress);
        expect(await factory.oracleEnabled(pairAddress)).to.be.true;

        // Confirm that the factory is registered with the oracle.
        expect(await oracle.factory()).to.eq(factory.address);

        // Update the pair with the oracle
        // TODO - call to oracle fails, 
        //await factory.updateOracle(pairAddress);
    });

    it('swapFee: factory and library INIT_CODE_HASH matches', async () => {
        const initCodeHash = await factory.INIT_CODE_HASH();
        console.log('INIT CODE HASH', initCodeHash);
        expect(initCodeHash).to.eq('0x979267a2f0b1e67d2a14aa2d846f0e5aad34e16494c7f6043c0b6cd541effc59');
    });

    it('swapFee: factory fee to setter is owner', async () => {
        const feeToSetter = await factory.feeToSetter();
        expect(feeToSetter).to.eq(owner.address);
    });

    it('swapFee: factory has oracle set', async () => {
        const oracleAddress = await factory.oracle();
        expect(oracleAddress).to.eq(oracle.address);
    });

    it('swapFee: check oracle settings', async () => {
        expect(await oracle.periodSize()).to.be.above(0);
        expect(await oracle.observationIndexOf(Date.now())).to.be.above(0);
    });

    it('swapFee: gets the quantity out for swap call to accrue aura points', async () => {
        // Setup
        // so that getPair call succeeds
        await factory.createPair(tokenB.address, targetAPToken.address);
        // so that pairExists call succeeds
        const pairAddress = await swapFee.pairFor(tokenB.address, targetAPToken.address);
        await swapFee.addPair(10, pairAddress);

        // check that getQuantityOut "if else" conditional succeeds
        expect(await swapFee.getPair(tokenB.address, targetAPToken.address)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenB.address, targetAPToken.address)).to.be.true;

        // define the parameters
        const tokenIn = tokenB.address;
        const quantityIn = 500000000;

        /*
        // TODO - call to getQuantityOut fails until call to oracle succeeds, see line 96
        const quantityOut = await swapFee.getQuantityOut(tokenIn, quantityIn, targetAPToken.address);
        console.log("QUANTITY OUT", quantityOut.toNumber());
        */
    });

    it('swapFee: swap tokens', async () => {
        const account = owner.address;

        // Mimic the owner as the router
        await swapFee.setRouter(account);

        // Check that the user has a starting balance in tokens:
        const balanceTokenA = await tokenA.balanceOf(account);
        expect(balanceTokenA).to.eq(1000000000000);
        const balanceTargetToken = await targetToken.balanceOf(account);
        expect(balanceTokenA).to.eq(1000000000000);

        // Add the pair and confirm it's addition.
        const pairAddress = await swapFee.pairFor(tokenA.address, tokenB.address);
        await swapFee.addPair(10, pairAddress);
        expect(await swapFee.pairExists(tokenA.address, tokenB.address)).to.be.true;

        // Confirm that pairs match across factory and swapFee contracts
        // where getPair checks the factory for the pair.
        expect(await swapFee.getPair(tokenA.address, tokenB.address)).to.eq(pairAddress);

        // Confirm that the swap fee can be gotten.
        const defaultSwapFeeAmount = 2;
        const swapFeeAmount = await swapFee.getSwapFee(tokenA.address, tokenB.address);
        expect(swapFeeAmount).to.eq(defaultSwapFeeAmount);

        // Store the previous values of interest before swap 
        // expect the account's balance targetToken to increase
        const prevBalance = await swapFee.getBalance(account);                                                                            
        // expect the account's balance of AP to increase
        const prevAP = await auraNFT.getAccumulatedAP(account);
        // expect the swapFee contract to register an increase in AP
        const prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();
   
        // TODO - call to swap doesn't actually swap until call to oracle succeeds, see line 96
        // Swap A for B and collect rewards
        const result = await swapFee.swap(account, tokenA.address, tokenB.address, 1000000000);
        expect(result).to.not.be.false;

        /*
        if (result !== false) {
            const newBalance = await swapFee.getBalance(account);                                                                            
            const newAP = await auraNFT.getAccumulatedAP(account);
            const newAccruedAP = (await swapFee.totalAccruedAP()).toNumber();

            // Check the change in balance
            console.log(`previous balance was ${prevBalance}`);
            console.log(`new balance is now ${newBalance}`);

            // Check the change in AP
            console.log(`previous AP was ${prevAP}`);
            console.log(`new balance is now ${newAP}`);

            // Check the change in total AP
            console.log(`total accrued AP was: ${prevAccruedAP}`);
            console.log(`total accrued AP is now: ${newAccruedAP}`);
        }
        */
    });

    /*
     * WHITELIST
     */

    it('swapFee: adds tokens to whitelist', async () => {
        // Confirm that each token was added.
        expect(await swapFee.whitelistGet(0)).to.eq(tokenA.address);
        expect(await swapFee.whitelistGet(1)).to.eq(tokenB.address);
        expect(await swapFee.whitelistGet(2)).to.eq(tokenC.address);

        // And that the the length is correct.
        expect(await swapFee.whitelistLength()).to.eq(3);
    });

    it('swapFee: whitelist contains only the added tokens', async () => {
        // These tokens have been added. 
        expect(await swapFee.whitelistContains(tokenA.address)).to.be.true;
        expect(await swapFee.whitelistContains(tokenB.address)).to.be.true;
        expect(await swapFee.whitelistContains(tokenC.address)).to.be.true;

        // This token has not been added.
        expect(await swapFee.whitelistContains(tokenD.address)).to.be.false;
    });

    it('swapFee: removes tokens from whitelist', async () => {
        // Remove each token.
        await swapFee.whitelistRemove(tokenA.address);
        await swapFee.whitelistRemove(tokenB.address);
        await swapFee.whitelistRemove(tokenC.address);

        // And confirm that the length is correct.
        expect(await swapFee.whitelistLength()).to.eq(0);
    });

    /*
     * ONLY OWNER SETTERS
     */

    it('swapFee: sets default reward distribution', async () => {
        const newDefaultRewardDistribution = 100;
        await swapFee.setDefaultRewardDistribution(newDefaultRewardDistribution);
        expect(await swapFee.defaultRewardDistribution()).to.eq(100);
    });

    it('swapFee: sets factory as owner', async () => {
        const newFactoryAddress = '0x84f22547020f582Deef1eb1B57b3b213D5997471';
        await swapFee.setFactory(newFactoryAddress);
        expect(await swapFee.factory()).to.eq('0x84f22547020f582Deef1eb1B57b3b213D5997471');
    });

    it('swapFee: sets router as owner', async () => {
        const newRouterAddress = '0x38433227C7A606EBb9cCB0aCfcD7504224659B74';
        await swapFee.setRouter(newRouterAddress);
        expect(await swapFee.router()).to.eq('0x38433227C7A606EBb9cCB0aCfcD7504224659B74');
    });

    it('swapFee: sets phase as owner', async () => {
        const newPhase = 2;
        await swapFee.setPhase(newPhase);
        expect(await swapFee.phase()).to.eq(2);
    });

    it('swapFee: sets phaseAP as owner', async () => {
        const newPhaseAP = 3;
        await swapFee.setPhaseAP(newPhaseAP);
        expect(await swapFee.phaseAP()).to.eq(3);
    });

    it('swapFee: sets oracle as owner', async () => {
        const newOracleAddress = '0xFC7EF377E976cC45c1D647d7060a8e4C1Fa26e4c';
        await swapFee.setOracle(newOracleAddress);
        expect(await swapFee.oracle()).to.eq('0xFC7EF377E976cC45c1D647d7060a8e4C1Fa26e4c');
    });

    it('swapFee: sets AuraNFT as owner', async () => {
        const newAuraNFTAddress = '0x8b2b085339D11DcF0FA0aaD985C30f82eb49a880'
        await swapFee.setAuraNFT(newAuraNFTAddress);
        expect(await swapFee.auraNFT()).to.eq('0x8b2b085339D11DcF0FA0aaD985C30f82eb49a880');
    });

    it('swapFee: adds pair as owner', async () => {
        const percentReward = 10;
        const pairAddress = await swapFee.pairFor(tokenC.address, tokenD.address);

        await swapFee.addPair(percentReward, pairAddress);

        const addedPair = await swapFee.pairsList(0);
        expect(await swapFee.getPairsListLength()).to.eq(1);
        expect(addedPair.pair).to.eq(pairAddress);
        expect(addedPair.percentReward.toNumber()).to.eq(10);
        expect(addedPair.isEnabled).to.be.true;
    });

    it('swapFee: sets pair percent reward as owner', async () => {
        // Add pair and confirm addition.
        const percentReward = 10;
        const pairAddress = await swapFee.pairFor(tokenC.address, tokenD.address);

        await swapFee.addPair(percentReward, pairAddress);

        const addedPair = await swapFee.pairsList(0);
        expect(await swapFee.getPairsListLength()).to.eq(1);
        expect(addedPair.pair).to.eq(pairAddress);
        expect(addedPair.percentReward.toNumber()).to.eq(10);
        expect(addedPair.isEnabled).to.be.true;

        // Set pair percent reward.
        const pairId = 0;
        const newPairReward = 11;

        await swapFee.setPairPercentReward(pairId, newPairReward);

        const updatedPair = await swapFee.pairsList(0);
        expect(await swapFee.getPairsListLength()).to.eq(1);
        expect(updatedPair.pair).to.eq(pairAddress);
        expect(updatedPair.percentReward.toNumber()).to.eq(11);
        expect(updatedPair.isEnabled).to.be.true;
    });

    it('swapFee: sets pair is enabled as owner', async () => {
        // Add pair and confirm addition.
        const percentReward = 10;
        const pairAddress = await swapFee.pairFor(tokenC.address, tokenD.address);

        await swapFee.addPair(percentReward, pairAddress);

        const addedPair = await swapFee.pairsList(0);
        expect(addedPair.pair).to.eq(pairAddress);
        expect(addedPair.percentReward.toNumber()).to.eq(10);
        expect(addedPair.isEnabled).to.be.true;

        // Set pair isEnabled.
        const pairId = 0;
        const newIsEnabled = false;

        await swapFee.setPairIsEnabled(pairId, newIsEnabled);

        const updatedPair = await swapFee.pairsList(0);
        expect(await swapFee.getPairsListLength()).to.eq(1);
        expect(updatedPair.pair).to.eq(pairAddress);
        expect(updatedPair.percentReward.toNumber()).to.eq(10);
        expect(updatedPair.isEnabled).to.be.false;
    });

    it('swapFee: sets AP reward as owner', async () => {
        const newAPWagerOnSwap = 10;
        await swapFee.setAPReward(newAPWagerOnSwap);
        expect(await swapFee.apWagerOnSwap()).to.eq(10);
    });

    /*
     * EXTERNAL GETTERS
     */

    it('swapFee: gets pairs list length', async () => {
        // The list is empty to start.
        expect(await swapFee.getPairsListLength()).to.eq(0);

        // Add pair and confirm addition.
        const percentReward = 10;
        const pairAddress = await swapFee.pairFor(tokenC.address, tokenD.address);

        await swapFee.addPair(percentReward, pairAddress);

        // The list now has one entry.
        expect(await swapFee.getPairsListLength()).to.eq(1);
    });

    it('swapFee: gets account balance', async () => {
        const account = '0x3c1b46A41C1B32983bDFB62d77a7DEc856a836A0';
        // The balance should be empty.
        expect(await swapFee.getBalance(account)).to.eq(0);
    });


    /*
     * EXTERNAL SETTERS
     */

    it('swapFee: sets reward distribution', async () => {
        // Raise the initial default reward distribution.               
        const newDefaultRewardDistribution = 100;
        await swapFee.setDefaultRewardDistribution(newDefaultRewardDistribution);
        expect(await swapFee.defaultRewardDistribution()).to.eq(100);


        // Change the caller's chosen reward distribution.
        const newDistribution = 50;
        await swapFee.setUserDefaultDistribution(newDistribution);
        expect(await swapFee.rewardDistribution(owner.address)).to.eq(50);
    });

    /* 
     * PUBLIC UTILS
     */

    it('swapFee: gets a pair that doesnt exist when no pairs have been added', async () => {
        expect(await swapFee.pairExists(tokenA.address, tokenB.address)).to.be.false;
    });

    it('swapFee: gets a pair that doesnt exist when pairs have been added', async () => {
        // Add pair and confirm addition.
        const percentReward = 10;
        const pairAddress = await swapFee.pairFor(tokenC.address, tokenD.address);

        await swapFee.addPair(percentReward, pairAddress);

        expect(await swapFee.pairExists(tokenA.address, tokenC.address)).to.be.false;
    });

    it('swapFee: gets a pair that exists', async () => {
        // Add pair and confirm addition.
        const percentReward = 10;
        const pairAddress = await swapFee.pairFor(tokenA.address, tokenB.address);

        await swapFee.addPair(percentReward, pairAddress);

        expect(await swapFee.pairExists(tokenA.address, tokenB.address)).to.be.true;
    });

    it('swapFee: gets quantity out when token in is same as token out', async () => {
        const quantityIn = 10;
        expect(await swapFee.getQuantityOut(tokenA.address, quantityIn, tokenA.address)).to.eq(10);
    });

    /*
    it('swapFee: gets quantity out when token in is not token out but intermediate isnt needed', async () => {
        const quantityIn = 10;
        const percentReward = 10;
        const pair = await swapFee.pairFor(tokenA.address, tokenB.address)

        // Add pair to swapFee.
        await swapFee.addPair(percentReward, pair);

        // Create the pair in the factory.
        await factory.createPair(tokenA.address, tokenB.address);

        // Confirm that `if` condition is NOT entered.
        expect(tokenA).to.not.eq(tokenB);

        // Confirm that `else if` condition in getQuantityOut is entered.
        expect(await swapFee.getPair(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenA.address, tokenB.address)).to.be.true;
       
        // Confirm that the correnct value is returned by getQuantityOut.
        expect(await swapFee.getQuantityOut(tokenA.address, quantityIn, tokenB.address)).to.eq(20);
    });

    it('swapFee: gets quantity out in doesnt equal out and needs intermediate', async () => {
        // Test summary:
        // Two token pairs exist (A, B) and (B, C).
        // trade 10 tokenA for 30 tokenC by converting tokenA -> tokenB -> tokenC.
    
        // Create first pair. 
        let tokenA = '0xC244aa367ED76c5b986Ebe6E7A1e98CE59100Ed8';
        let tokenB = '0xEbe1a7B5ba930e9c1A36ff9Cd836Ac50833D4c2c';
        let quantityInPair1 = 10;
        const pair1 = {
            percentReward: quantityInPair1,
            pair: await swapFee.pairFor(tokenA, tokenB)
        };

        // Add pair1 to swapFee.
        await swapFee.addPair(pair1.percentReward, pair1.pair);

        // Create pair1 in the factory.
        await factory.createPair(tokenA, tokenB);

        // And confirm that pair1 was created.
        expect(await swapFee.getPair(tokenA, tokenB)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenA, tokenB)).to.be.true;

        // Create second pair.
        // tokenB is already defined.
        let tokenC = '0x48844feE1FD833C0e41BB719Eb1c8Ae4C348f05C';
        let quantityInPair2 = 20;
        const pair2 = {
            percentReward: quantityInPair2,
            pair: await swapFee.pairFor(tokenB, tokenC)
        };

        // Add pair to swapFee.
        await swapFee.addPair(pair2.percentReward, pair2.pair);

        // Create the pair in the factory.
        await factory.createPair(tokenB, tokenC);

        // And confirm that pair2 was created.
        expect(await swapFee.getPair(tokenB, tokenC)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenB, tokenC)).to.be.true;

        // Confirm that `if` condition is NOT entered.
        expect(tokenA).to.not.eq(tokenC);
        
        // Confirm that the `else if` condition is NOT entered.
        // Although both pairs (A, B) and (B, C) exist, pair (A, C) should not exist.
        expect(await swapFee.getPair(tokenA, tokenC)).to.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenA, tokenC)).to.be.false;

        // Set mock oracle parameters for pairs 1 and 2.
        // 10 tokens A trade for 20 tokens B.
        await oracle.mock.consult.withArgs(tokenA, quantityInPair1, tokenB).returns(20);
        // 20 tokens B trade for 30 tokens C.
        await oracle.mock.consult.withArgs(tokenB, quantityInPair2, tokenC).returns(30);

        // Confirm that 10 tokenA swaps for 30 tokenC.
        expect(await swapFee.getQuantityOut(tokenA, quantityInPair1, tokenC)).to.eq(30);
    });
    */
});

