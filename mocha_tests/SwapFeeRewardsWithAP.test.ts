import chai, { expect, use } from 'chai';
import { Contract, constants } from 'legacy-ethers';
import { solidity, loadFixture, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle';

import AuraPairJson from '../build/contracts/AuraPair.json';
import SwapFeeRewardsWithAP from '../build/contracts/SwapFeeRewardsWithAP.json';
import { swapFeeFixture } from './shared/swapFixtures';

use(solidity);

const gasLimit = 999999999

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
        // Register with router
        await router.setSwapFeeReward(swapFee.address);
        await auraNFT.initialize("BASEURI", 100000, 20);

        // Add callers as accruers with NFT
        await auraNFT.addAccruer(swapFee.address);
        expect(await auraNFT.isAccruer(swapFee.address)).to.be.true;
        await auraNFT.addAccruer(owner.address);
        expect(await auraNFT.isAccruer(owner.address)).to.be.true;
    });

    beforeEach(async () => {
        // Add 3 tokens to contract.
        await swapFee.whitelistAdd(tokenA.address);
        expect(await swapFee.whitelistContains(tokenA.address)).to.be.true;
        await swapFee.whitelistAdd(tokenB.address);
        expect(await swapFee.whitelistContains(tokenB.address)).to.be.true;
        await swapFee.whitelistAdd(tokenC.address);
        expect(await swapFee.whitelistContains(tokenC.address)).to.be.true;
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
        // factory fee to setter must be owner to change factory settings
        const feeToSetter = await factory.feeToSetter();
        expect(feeToSetter).to.eq(owner.address);
    });

    beforeEach(async () => {
        // Register the oracle and the factory with eachother.
        await factory.setOracle(oracle.address);
        expect(await factory.oracle()).to.eq(oracle.address);
        expect(await oracle.factory()).to.eq(factory.address);
    });

    beforeEach(async () => {
        // Create the (A, B) pair
        await factory.createPair(tokenA.address, tokenB.address);
        expect(await swapFee.getPair(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero);

        // Create the (B, AP) pair
        await factory.createPair(tokenB.address, targetAPToken.address);
        expect(await swapFee.getPair(tokenB.address, targetAPToken.address)).to.not.eq(constants.AddressZero);

        // Create the (B, TT) pair
        await factory.createPair(tokenB.address, targetToken.address);
        expect(await swapFee.getPair(tokenB.address, targetToken.address)).to.not.eq(constants.AddressZero);

        // Enable the (A, B) pair
        const pairAddressAB = await factory.getPair(tokenA.address, tokenB.address);
        await factory.enablePair(pairAddressAB);
        expect(await factory.oracleEnabled(pairAddressAB)).to.be.true;
    
        // Enable the (B, AP) pair
        const pairAddressBAP = await factory.getPair(tokenB.address, targetAPToken.address);
        await factory.enablePair(pairAddressBAP);
        expect(await factory.oracleEnabled(pairAddressBAP)).to.be.true;

        // Enable the (B, TT) pair
        const pairAddressBTT = await factory.getPair(tokenB.address, targetToken.address);
        await factory.enablePair(pairAddressBTT);
        expect(await factory.oracleEnabled(pairAddressBTT)).to.be.true;

        // In the next block, transfer funds of tokenA, tokenB, targetAPToken, and targetToken
        // to the token pairs AB, BAP, BTT and check the results
        const account = owner.address;

        // account's prev token balances
        const prevAccountTokenABalance = await tokenA.balanceOf(account);
        const prevAccountTokenBBalance = await tokenA.balanceOf(account);
        const prevAccountTargetTokenBalance = await tokenA.balanceOf(account);
        const prevAccountTargetAPTokenBalance = await tokenA.balanceOf(account);

        // pair prev token balances
        const prevABPairTokenABalance = await tokenA.balanceOf(pairAddressAB);
        const prevABPairTokenBBalance = await tokenB.balanceOf(pairAddressAB);

        const prevBAPPairTokenBBalance = await tokenB.balanceOf(pairAddressBAP);
        const prevBAPPairTargetAPTokenBalance = await targetAPToken.balanceOf(pairAddressBAP);

        const prevBTTPairTokenBBalance = await tokenB.balanceOf(pairAddressBTT);
        const prevBTTPairTargetTokenBalance = await targetToken.balanceOf(pairAddressBTT);

        const tokenAAmount = 50000000;
        const tokenBAmount = 50000000;
        const targetAPTokenAmount = 50000000;
        const targetTokenAmount = 50000000;
    
        // transfer tokens to the pairs
        await tokenA.transfer(pairAddressAB, tokenAAmount);
        await tokenB.transfer(pairAddressAB, tokenBAmount);

        await tokenB.transfer(pairAddressBAP, tokenBAmount);
        await targetAPToken.transfer(pairAddressBAP, targetAPTokenAmount);

        await tokenB.transfer(pairAddressBTT, tokenBAmount);
        await targetToken.transfer(pairAddressBTT, targetTokenAmount);

        // account's new token balances
        const newAccountTokenABalance = await tokenA.balanceOf(account);
        const newAccountTokenBBalance = await tokenA.balanceOf(account);
        const newAccountTargetTokenBalance = await tokenA.balanceOf(account);
        const newAccountTargetAPTokenBalance = await tokenA.balanceOf(account);

        // pair new token balances
        const newABPairTokenABalance = await tokenA.balanceOf(pairAddressAB);
        const newABPairTokenBBalance = await tokenB.balanceOf(pairAddressAB);

        const newBAPPairTokenBBalance = await tokenB.balanceOf(pairAddressBAP);
        const newBAPPairTargetAPTokenBalance = await targetAPToken.balanceOf(pairAddressBAP);

        const newBTTPairTokenBBalance = await tokenB.balanceOf(pairAddressBTT);
        const newBTTPairTargetTokenBalance = await targetToken.balanceOf(pairAddressBTT);

        // check the results 
        expect(newAccountTokenABalance).to.eq(prevAccountTokenABalance - tokenAAmount);
        expect(newAccountTokenBBalance).to.eq(prevAccountTokenBBalance - tokenBAmount);
        expect(newAccountTargetAPTokenBalance).to.eq(prevAccountTargetAPTokenBalance - targetAPTokenAmount);
        expect(newAccountTargetTokenBalance).to.eq(prevAccountTargetTokenBalance - targetTokenAmount);

        expect(newABPairTokenABalance).to.eq(prevABPairTokenABalance + tokenAAmount);
        expect(newABPairTokenBBalance).to.eq(prevABPairTokenBBalance + tokenBAmount);

        expect(newBAPPairTokenBBalance).to.eq(prevBAPPairTokenBBalance + tokenBAmount);
        expect(newBAPPairTargetAPTokenBalance).to.eq(prevBAPPairTargetAPTokenBalance + targetAPTokenAmount);

        expect(newBTTPairTokenBBalance).to.eq(prevBTTPairTargetTokenBalance + tokenBAmount);
        expect(newBTTPairTargetTokenBalance).to.eq(prevBTTPairTargetTokenBalance + targetTokenAmount);

        // Now that the pairs have positive balances, we want to cause the pairs' reserves and cumulativeLast
        // state variables to be positive, so we mint the pairs and check the changes made to those variables
        // First, we need to get the pair contracts from their addresses 
        const pairAB = new Contract(pairAddressAB, JSON.stringify(AuraPairJson.abi), provider).connect(owner);
        const pairBAP = new Contract(pairAddressBAP, JSON.stringify(AuraPairJson.abi), provider).connect(owner);
        const pairBTT = new Contract(pairAddressBTT, JSON.stringify(AuraPairJson.abi), provider).connect(owner);
        
        // previous reserves to check the difference after mint
        const [prevABReserve0, prevABReserve1, ] = await pairAB.getReserves();
        const [prevBAPReserve0, prevBAPReserve1, ] = await pairBAP.getReserves();
        const [prevBTTReserve0, prevBTTReserve1, ] = await pairBTT.getReserves();

        // previous cumulative pair prices to compare after mint
        const prevABPrice0 = await pairAB.price0CumulativeLast();
        const prevABPrice1 = await pairAB.price0CumulativeLast();

        const prevBAPPrice0 = await pairBAP.price0CumulativeLast();
        const prevBAPPrice1 = await pairBAP.price1CumulativeLast();

        const prevBTTPrice0 = await pairBTT.price0CumulativeLast();
        const prevBTTPrice1 = await pairBTT.price1CumulativeLast();

        // mint the pairs
        await pairAB.mint(account);
        await pairBAP.mint(account);
        await pairBTT.mint(account);
        
        // new reserves to compare against the previous
        const [newABReserve0, newABReserve1, ] = await pairAB.getReserves();
        const [newBAPReserve0, newBAPReserve1, ] = await pairBAP.getReserves();
        const [newBTTReserve0, newBTTReserve1, ] = await pairBTT.getReserves();

        // new cumulative pair prices to compare against the previous
        const newABPrice0 = await pairAB.price0CumulativeLast();
        const newABPrice1 = await pairAB.price0CumulativeLast();

        const newBAPPrice0 = await pairBAP.price0CumulativeLast();
        const newBAPPrice1 = await pairBAP.price1CumulativeLast();

        const newBTTPrice0 = await pairBTT.price0CumulativeLast();
        const newBTTPrice1 = await pairBTT.price1CumulativeLast();

        // check the results
        expect(newABReserve0).to.eq(prevABReserve0 + tokenAAmount);
        expect(newABReserve1).to.eq(prevABReserve1 + tokenBAmount);

        expect(newBAPReserve0).to.eq(prevBAPReserve0 + tokenBAmount);
        expect(newBAPReserve1).to.eq(prevBAPReserve1 + targetAPTokenAmount);

        expect(newBTTReserve0).to.eq(prevBTTReserve0 + tokenBAmount);
        expect(newBTTReserve1).to.eq(prevBTTReserve1 + targetTokenAmount);

        /*
        console.log(`pair AB reserve0 prev: ${prevABReserve0} new: ${newABReserve0}`);
        console.log(`pair AB reserve1 prev: ${prevABReserve1} new: ${newABReserve1}`);

        console.log(`pair BAP reserve0 prev: ${prevBAPReserve0} new: ${newBAPReserve0}`);
        console.log(`pair BAP reserve1 prev: ${prevBAPReserve1} new: ${newBAPReserve1}`);

        console.log(`pair BTT reserve0 prev: ${prevBTTReserve0} new: ${newBTTReserve0}`);
        console.log(`pair BTT reserve1 prev: ${prevBTTReserve1} new: ${newBTTReserve1}`);

        console.log(`pair AB price0 prev: ${prevABPrice0} new: ${newABPrice0}`);
        console.log(`pair AB price1 prev: ${prevABPrice1} new: ${newABPrice1}`);

        console.log(`pair BAP price0 prev: ${prevBAPPrice0} new: ${newBAPPrice0}`);
        console.log(`pair BAP price1 prev: ${prevBAPPrice1} new: ${newBAPPrice1}`);

        console.log(`pair BTT price0 prev: ${prevBTTPrice0} new: ${newBTTPrice0}`);
        console.log(`pair BTT price1 prev: ${prevBTTPrice1} new: ${newBTTPrice1}`);
        */

        // Update the (A, B) pair
        await oracle.update(tokenA.address, tokenB.address, { gasLimit });
        let granularity = await oracle.granularity();
        const pairABObservations = await oracle.pairObservations(pairAddressAB, granularity - 1);
        expect(await pairABObservations.length).to.eq(3);
      
        // Upate the (B, AB) pair
        await oracle.update(tokenB.address, targetAPToken.address, { gasLimit });
        granularity = await oracle.granularity();
        const pairBAPObservations = await oracle.pairObservations(pairAddressBAP, granularity - 1);
        expect(await pairBAPObservations.length).to.eq(3);

        // Upate the (B, TT) pair
        await oracle.update(tokenB.address, targetToken.address, { gasLimit });
        granularity = await oracle.granularity();
        const pairBTTObservations = await oracle.pairObservations(pairAddressBTT, granularity - 1);
        expect(await pairBTTObservations.length).to.eq(3);
    });
    
    it('swapFee: factory and library INIT_CODE_HASH must match', async () => {
        const initCodeHash = await factory.INIT_CODE_HASH();
        console.log('INIT CODE HASH', initCodeHash);
        //expect(initCodeHash).to.eq('0x979267a2f0b1e67d2a14aa2d846f0e5aad34e16494c7f6043c0b6cd541effc59');
        //expect(initCodeHash).to.eq('0xef26689277ecbc19c2c971e6328183dfe2ee30d3713c7d1e4f48aa73a3d70ce6');
    });

    it('swapFee: check oracle settings', async () => {
        expect(await oracle.periodSize()).to.be.above(0);
        expect(await oracle.granularity()).to.be.above(0);
        expect(await oracle.factory()).to.eq(await swapFee.factory());
    });

    it('swapFee: call oracle consult with (A, B) pair', async () => {
        // Check that the pair is properly returning
        expect(await swapFee.pairFor(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero);

        // Confirm that window size is set, i.e. 48
        expect(await oracle.windowSize()).to.eq(48);

        const granularity = await oracle.granularity();
        expect(granularity).to.eq(24);

        // Make sure that oracle is called so that firstObservation is set
        // check that firstObservation is set by making sure that pairObservations has been created
        let tx = await oracle.update(tokenA.address, tokenB.address);
        await tx.wait();

        const pairAddressAB = await swapFee.pairFor(tokenA.address, tokenB.address);
        const pairABObservations = await oracle.pairObservations(pairAddressAB, granularity - 1);
        expect(await pairABObservations.length).to.eq(3);

        // Must manually set timeElapsed in consult to about 45 and recompile for consult to work.
        // Probably due to insufficient time between calls by the test suite. 

        const amountOut = await oracle.consult(tokenA.address, 1000000000, tokenB.address, );
        console.log("AMOUNT OUT", amountOut.toNumber());
    });

    it('swapFee: gets the quantity out for swap call to accrue aura points', async () => {
        // Setup
        // so that getPair call succeeds
        // so that pairExists call succeeds
        const pairAddress = await swapFee.pairFor(tokenB.address, targetAPToken.address);
        await swapFee.addPair(10, pairAddress);

        // check that getQuantityOut "if else" conditional succeeds
        expect(await swapFee.getPair(tokenB.address, targetAPToken.address)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenB.address, targetAPToken.address)).to.be.true;

        // define the parameters
        const tokenIn = tokenB.address;
        const quantityIn = 500000000;

        // TODO - call to getQuantityOut fails until call to oracle succeeds, see line 96
        const quantityOut = await swapFee.getQuantityOut(tokenIn, quantityIn, targetAPToken.address);
        console.log("QUANTITY OUT", quantityOut.toNumber());
    });

    it('swapFee: swap tokens', async () => {
        const account = owner.address;

        // Mimic the owner as the router
        await swapFee.setRouter(account);

        // Add the pairs and confirm addition.
        const pairAddressAB = await swapFee.pairFor(tokenA.address, tokenB.address);
        await swapFee.addPair(10, pairAddressAB);
        expect(await swapFee.pairExists(tokenA.address, tokenB.address)).to.be.true;

        const pairAddressBAP = await swapFee.pairFor(tokenB.address, targetAPToken.address);
        await swapFee.addPair(10, pairAddressBAP);
        expect(await swapFee.pairExists(tokenB.address, targetAPToken.address)).to.be.true;

        const pairAddressBTT = await swapFee.pairFor(tokenB.address, targetToken.address);
        await swapFee.addPair(10, pairAddressBTT);
        expect(await swapFee.pairExists(tokenB.address, targetToken.address)).to.be.true;

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
 
        // Swap A for B and collect rewards
        const result = await swapFee.swap(account, tokenA.address, tokenB.address, 1000000000);
        expect(result).to.not.be.false;

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
    });

    it('swapFee: withdraw tokens', async () => {
        const account = owner.address;

        // Mimic the owner as the router
        await swapFee.setRouter(account);

        let prevBalance = await swapFee.getBalance(account);
        let prevTotalMined = await swapFee.totalMined();

        // Call withdraw()
        let tx = await swapFee.withdraw();
        await tx.wait();

        if (tx) {
            // Check the change in balance
            console.log(`previous balance: ${prevBalance}`);
            const newBalance = await swapFee.getBalance(account);
            console.log(`new balance: ${newBalance}`);

            // Check the change in total mined
            console.log(`Previous total mined was: ${prevTotalMined}`);
            const newTotalMined = await swapFee.totalMined();
            console.log(`Total mined is: ${newTotalMined}`);
        } else {
            console.log('Withdraw failed');
        }
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

