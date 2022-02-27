import chai, { expect, use } from 'chai';
import { Contract, constants } from 'legacy-ethers';
import { solidity, loadFixture, MockProvider, createFixtureLoader } from 'legacy-ethereum-waffle';

import AuraPairJson from '../build/contracts/AuraPair.json';
import SwapFeeRewardsWithAP from '../build/contracts/SwapFeeRewardsWithAP.json';
import { swapFeeFixture } from './shared/swapFixtures';

use(solidity);

const verbose = false;
const gasLimit = 999999999;

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

    // factory pairs step 2.
    let pairAddressAB: string;
    let pairAddressBAP: string;
    let pairAddressBTT: string;

    let pairAB: Contract;
    let pairBAP: Contract;
    let pairBTT: Contract;

    // factory pairs step 3.
    const tokenAAmount = 50000000;
    const tokenBAmount = 50000000;
    const targetAPTokenAmount = 50000000;
    const targetTokenAmount = 50000000;

    let prevAccountTokenABalance = 0;
    let prevAccountTokenBBalance = 0;
    let prevAccountTargetTokenBalance = 0;
    let prevAccountTargetAPTokenBalance = 0;

    let prevABPairTokenABalance = 0;
    let prevABPairTokenBBalance = 0;

    let prevBAPPairTokenBBalance = 0;
    let prevBAPPairTargetAPTokenBalance = 0;

    let prevBTTPairTokenBBalance = 0;
    let prevBTTPairTargetTokenBalance = 0;

    // factory pairs step 4.
    let prevABReserve0 = 0;
    let prevABReserve1 = 0;
    let prevBAPReserve0 = 0
    let prevBAPReserve1 = 0;
    let prevBTTReserve0 = 0
    let prevBTTReserve1 = 0;

    let prevABPrice0 = 0;
    let prevABPrice1 = 0;

    let prevBAPPrice0 = 0;
    let prevBAPPrice1 = 0;

    let prevBTTPrice0 = 0;
    let prevBTTPrice1 = 0;

    // factory pairs step 6.
    let granularity = 0;

    // swapFee step 7.
    const swapFeeAuraBalance = '100000000000000000';

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
        // Register the oracle and the factory with eachother.
        await factory.setOracle(oracle.address);

        // the workflow for setting factory pairs must be in the following order:
        // 1. create the pair address
        // 2. get an instance of the pair so that it's functions can be called
        // 3. transfer funds of each token to the pair so that the pair has a positive balance of each token
        // 4. mint the pair to trigger an update so that the token balances are moved to the pair's reserves
        // 5. enable the pair in the factory so that the pair can be updated with the oracle
        // 6. update the pair in the oracle so that an historical observation is made which allows oracle.consult to work

        // 1. create the pairs
        // Create the (A, B) pair
        await factory.createPair(tokenA.address, tokenB.address);
        // Create the (B, AP) pair
        await factory.createPair(tokenB.address, targetAPToken.address);
        // Create the (B, TT) pair
        await factory.createPair(tokenB.address, targetToken.address);

        // 2. get pair instances
        pairAddressAB = await factory.getPair(tokenA.address, tokenB.address);
        pairAddressBAP = await factory.getPair(tokenB.address, targetAPToken.address);
        pairAddressBTT = await factory.getPair(tokenB.address, targetToken.address);

        // 3. fund the pairs
        // In the next block, transfer funds of tokenA, tokenB, targetAPToken, and targetToken

        // account's prev token balances
        prevAccountTokenABalance = await tokenA.balanceOf(owner.address);
        prevAccountTokenBBalance = await tokenA.balanceOf(owner.address);
        prevAccountTargetTokenBalance = await tokenA.balanceOf(owner.address);
        prevAccountTargetAPTokenBalance = await tokenA.balanceOf(owner.address);

        // pair prev token balances
        prevABPairTokenABalance = await tokenA.balanceOf(pairAddressAB);
        prevABPairTokenBBalance = await tokenB.balanceOf(pairAddressAB);

        prevBAPPairTokenBBalance = await tokenB.balanceOf(pairAddressBAP);
        prevBAPPairTargetAPTokenBalance = await targetAPToken.balanceOf(pairAddressBAP);

        prevBTTPairTokenBBalance = await tokenB.balanceOf(pairAddressBTT);
        prevBTTPairTargetTokenBalance = await targetToken.balanceOf(pairAddressBTT);

        // transfer tokens to the pairs
        await tokenA.transfer(pairAddressAB, tokenAAmount);
        await tokenB.transfer(pairAddressAB, tokenBAmount);

        await tokenB.transfer(pairAddressBAP, tokenBAmount);
        await targetAPToken.transfer(pairAddressBAP, targetAPTokenAmount);

        await tokenB.transfer(pairAddressBTT, tokenBAmount);
        await targetToken.transfer(pairAddressBTT, targetTokenAmount);
        
        // 4. mint
        pairAB = new Contract(pairAddressAB, JSON.stringify(AuraPairJson.abi), provider).connect(owner);
        pairBAP = new Contract(pairAddressBAP, JSON.stringify(AuraPairJson.abi), provider).connect(owner);
        pairBTT = new Contract(pairAddressBTT, JSON.stringify(AuraPairJson.abi), provider).connect(owner);

        // previous reserves to check the difference after mint
        [prevABReserve0, prevABReserve1, ] = await pairAB.getReserves();
        [prevBAPReserve0, prevBAPReserve1, ] = await pairBAP.getReserves();
        [prevBTTReserve0, prevBTTReserve1, ] = await pairBTT.getReserves();

        // previous cumulative pair prices to compare after mint
        prevABPrice0 = await pairAB.price0CumulativeLast();
        prevABPrice1 = await pairAB.price0CumulativeLast();

        prevBAPPrice0 = await pairBAP.price0CumulativeLast();
        prevBAPPrice1 = await pairBAP.price1CumulativeLast();

        prevBTTPrice0 = await pairBTT.price0CumulativeLast();
        prevBTTPrice1 = await pairBTT.price1CumulativeLast();

        // mint the pairs
        await pairAB.mint(owner.address);
        await pairBAP.mint(owner.address);
        await pairBTT.mint(owner.address);
        
        // 5. enable the pairs
        // Enable the (A, B) pair
        await factory.enablePair(pairAddressAB);
        // Enable the (B, AP) pair
        await factory.enablePair(pairAddressBAP);
        // Enable the (B, TT) pair
        await factory.enablePair(pairAddressBTT);
    
        // 6. update the pairs with the oracle
        granularity = await oracle.granularity();
      
        // Catch and continue because we'll make more calls to update later which might succeed
        try {
            // Update the oracle pairs to register historical observations
            await oracle.update(tokenA.address, tokenB.address, { gasLimit });
            await oracle.update(tokenB.address, targetAPToken.address, { gasLimit });
            await oracle.update(tokenB.address, targetToken.address, { gasLimit });
        } catch(error) {
            if (verbose) {
                console.error(error);
            }
        }
    });

    beforeEach(async () => {
        // Register with router
        await router.setSwapFeeReward(swapFee.address);

        await auraNFT.initialize("BASEURI", 100000, 20);

        // Add callers as accruers with NFT
        await auraNFT.addAccruer(swapFee.address);
        await auraNFT.addAccruer(owner.address);
    });

    beforeEach(async () => {
        // initialize swapFee contract

        // the steps for setting up the swap fee contract are:
        // 1. make sure the swapFee factory address is correct
        // 2. make sure the swapFee oracle address is correct
        // 3. make sure the swapFee router address is set to owner.address
        // 4. set the contractRewardDistribution to give the user the full range of choices
        // 5. set the userRewardDistribution to 50, to give them 50% AURA and 50% AP payout
        // 6. make sure all the tokens that'll be used are whitelisted
        // 7. make sure that the swapFee contract has a positive balance of auraToken

        await swapFee.setFactory(factory.address);
        await swapFee.setOracle(oracle.address);
        await swapFee.setRouter(owner.address);

        // set the contract reward distribution so that user has maximum choice
        await swapFee.setDefaultRewardDistribution(100);

        // set the caller distribution so they get an even payout (50/50) of AP and AURA tokens
        // NOTE - userRewardDistribution <= defaultRewardDistribution
        await swapFee.setUserDefaultDistribution(50); 

        await swapFee.whitelistAdd(tokenA.address);
        await swapFee.whitelistAdd(tokenB.address);
       
        await auraToken.transfer(swapFee.address, swapFeeAuraBalance);
    });

    it('swapFee: factory and library INIT_CODE_HASH must match', async () => {
        const initCodeHash = await factory.INIT_CODE_HASH();
        console.log('INIT CODE HASH', initCodeHash);
        //expect(initCodeHash).to.eq('0x979267a2f0b1e67d2a14aa2d846f0e5aad34e16494c7f6043c0b6cd541effc59');
        //expect(initCodeHash).to.eq('0xef26689277ecbc19c2c971e6328183dfe2ee30d3713c7d1e4f48aa73a3d70ce6');
    });

    it('swapFee: factory fee to setter is set to owner', async () => {
        // factory fee to setter must be owner to change factory settings
        expect(await factory.feeToSetter()).to.eq(owner.address);
    });

    it('swapFee: oracle factory address mismatch', async () => {
        expect(await oracle.factory()).to.eq(factory.address);
    });

    it('swapFee: factory oracle is set', async () => {
        expect(await factory.oracle()).to.eq(oracle.address);
    });

    it('swapFee: factory pairs step 1. pairs were created', async () => {
        expect(await swapFee.getPair(tokenA.address, tokenB.address)).to.not.eq(constants.AddressZero);
        expect(await swapFee.getPair(tokenB.address, targetAPToken.address)).to.not.eq(constants.AddressZero);
        expect(await swapFee.getPair(tokenB.address, targetToken.address)).to.not.eq(constants.AddressZero);
    });

    it('swapFee: factory pairs step 3.1. wallet balances have been updated', async () => {
        const newAccountTokenABalance = await tokenA.balanceOf(owner.address);
        const newAccountTokenBBalance = await tokenA.balanceOf(owner.address);
        const newAccountTargetTokenBalance = await tokenA.balanceOf(owner.address);
        const newAccountTargetAPTokenBalance = await tokenA.balanceOf(owner.address);

        expect(newAccountTokenABalance).to.eq(prevAccountTokenABalance - tokenAAmount);
        expect(newAccountTokenBBalance).to.eq(prevAccountTokenBBalance - tokenBAmount);
        expect(newAccountTargetAPTokenBalance).to.eq(prevAccountTargetAPTokenBalance - targetAPTokenAmount);
        expect(newAccountTargetTokenBalance).to.eq(prevAccountTargetTokenBalance - targetTokenAmount);
    });

    it('swapFee: factory pairs step 3.2. pair balances have been updated', async () => {
        const newABPairTokenABalance = await tokenA.balanceOf(pairAddressAB);
        const newABPairTokenBBalance = await tokenB.balanceOf(pairAddressAB);

        const newBAPPairTokenBBalance = await tokenB.balanceOf(pairAddressBAP);
        const newBAPPairTargetAPTokenBalance = await targetAPToken.balanceOf(pairAddressBAP);

        const newBTTPairTokenBBalance = await tokenB.balanceOf(pairAddressBTT);
        const newBTTPairTargetTokenBalance = await targetToken.balanceOf(pairAddressBTT);

        expect(newABPairTokenABalance).to.eq(prevABPairTokenABalance + tokenAAmount);
        expect(newABPairTokenBBalance).to.eq(prevABPairTokenBBalance + tokenBAmount);

        expect(newBAPPairTokenBBalance).to.eq(prevBAPPairTokenBBalance + tokenBAmount);
        expect(newBAPPairTargetAPTokenBalance).to.eq(prevBAPPairTargetAPTokenBalance + targetAPTokenAmount);

        expect(newBTTPairTokenBBalance).to.eq(prevBTTPairTargetTokenBalance + tokenBAmount);
        expect(newBTTPairTargetTokenBalance).to.eq(prevBTTPairTargetTokenBalance + targetTokenAmount);
    });

    it('swapFee: factory pairs step 4.1. minting has updated reserves', async () => {
        const [newABReserve0, newABReserve1, ] = await pairAB.getReserves();
        const [newBAPReserve0, newBAPReserve1, ] = await pairBAP.getReserves();
        const [newBTTReserve0, newBTTReserve1, ] = await pairBTT.getReserves();

        expect(newABReserve0).to.eq(prevABReserve0 + tokenAAmount);
        expect(newABReserve1).to.eq(prevABReserve1 + tokenBAmount);

        expect(newBAPReserve0).to.eq(prevBAPReserve0 + tokenBAmount);
        expect(newBAPReserve1).to.eq(prevBAPReserve1 + targetAPTokenAmount);

        expect(newBTTReserve0).to.eq(prevBTTReserve0 + tokenBAmount);
        expect(newBTTReserve1).to.eq(prevBTTReserve1 + targetTokenAmount);

        if (verbose) {
            console.log(`pair AB reserve0 new: ${newABReserve0}`);
            console.log(`pair AB reserve1 new: ${newABReserve1}`);

            console.log(`pair BAP reserve0 new: ${newBAPReserve0}`);
            console.log(`pair BAP reserve1 new: ${newBAPReserve1}`);

            console.log(`pair BTT reserve0 new: ${newBTTReserve0}`);
            console.log(`pair BTT reserve1 new: ${newBTTReserve1}`);
        }
    });

    it('swapFee: factory pairs step 4.2. minting has updated prices', async () => {
        const newABPrice0 = await pairAB.price0CumulativeLast();
        const newABPrice1 = await pairAB.price0CumulativeLast();

        const newBAPPrice0 = await pairBAP.price0CumulativeLast();
        const newBAPPrice1 = await pairBAP.price1CumulativeLast();

        const newBTTPrice0 = await pairBTT.price0CumulativeLast();
        const newBTTPrice1 = await pairBTT.price1CumulativeLast();
       
        if (verbose) {
            console.log(`pair AB price0 new: ${newABPrice0}`);
            console.log(`pair AB price1 new: ${newABPrice1}`);

            console.log(`pair BAP price0 new: ${newBAPPrice0}`);
            console.log(`pair BAP price1 new: ${newBAPPrice1}`);

            console.log(`pair BTT price0 new: ${newBTTPrice0}`);
            console.log(`pair BTT price1 new: ${newBTTPrice1}`);
        }
    });

    it('swapFee: factory pairs step 5. pairs are enabled', async () => {
        expect(await factory.oracleEnabled(pairAddressAB)).to.be.true;
        expect(await factory.oracleEnabled(pairAddressBAP)).to.be.true;
        expect(await factory.oracleEnabled(pairAddressBTT)).to.be.true;
    });

    it('swapFee: factory pairs step 6. oracle update succeeded', async () => {
        const pairABObservations = await oracle.pairObservations(pairAddressAB, granularity - 1);
        const pairBAPObservations = await oracle.pairObservations(pairAddressBAP, granularity - 1);
        const pairBTTObservations = await oracle.pairObservations(pairAddressBTT, granularity - 1);

        expect(await pairABObservations.length).to.eq(3);
        expect(await pairBAPObservations.length).to.eq(3);
        expect(await pairBTTObservations.length).to.eq(3);
    });

    it('swapFee: swapFee is registered with router', async () => {
        expect(await router.swapFeeReward()).to.eq(swapFee.address);
    });

    it('swapFee: auraNFT accruers are set', async () => {
        expect(await auraNFT.isAccruer(swapFee.address)).to.be.true;
        expect(await auraNFT.isAccruer(owner.address)).to.be.true;
    });

    it('swapFee: swapFee step 1. factory is set', async () => {
        expect(await swapFee.factory()).to.eq(factory.address);
    });

    it('swapFee: swapFee step 2. oracle is set', async () => {
        expect(await swapFee.oracle()).to.eq(oracle.address);
    });

    it('swapFee: swapFee step 3. router is set', async () => {
        expect(await swapFee.router()).to.eq(owner.address);
    });

    it('swapFee: swapFee step 4. contract reward distribution is set', async () => {
        expect(await swapFee.defaultRewardDistribution()).to.eq(100);
    });

    it('swapFee: swapFee step 5. user reward distribution is set', async () => {
        expect(await swapFee.rewardDistribution(owner.address)).to.eq(50);
    });

    it('swapFee: swapFee step 6. adds tokens to whitelist', async () => {
        expect(await swapFee.whitelistContains(tokenA.address)).to.be.true;
        expect(await swapFee.whitelistContains(tokenB.address)).to.be.true;
        expect(await swapFee.whitelistLength()).to.eq(2);
    });

    it('swapFee: swapFee step 7. swapFee contract has the correct aura balance', async () => {
        expect((await auraToken.balanceOf(swapFee.address))).to.eq(swapFeeAuraBalance);
    });

    it('swapFee: check oracle settings', async () => {
        expect(await oracle.periodSize()).to.be.above(0);
        expect(await oracle.granularity()).to.be.above(0);
        expect(await oracle.factory()).to.eq(await swapFee.factory());
    });

    it('swapFee: call oracle consult with (A, B) pair (expected to occasionally fail)', async () => {
        const tokenIn = tokenA.address;
        const amountIn = 1000000000;
        const tokenOut = tokenB.address;
        const pairAddress = await swapFee.pairFor(tokenIn, tokenOut);

        // there will already have been one, but make another observation
        let tx = await oracle.update(tokenIn, tokenOut);
        await tx.wait();
       
        if (verbose) {
            // output the historical observations
            for (let i = 0; i < granularity; i++) {
                let observation = await oracle.pairObservations(pairAddress, i);
                console.log(`${i}`);
                console.log(`timestamp: ${observation.timestamp}`);
                console.log(`price0Cumulative: ${observation.price0Cumulative / 1e18}`);
                console.log(`price1Cumulative: ${observation.price1Cumulative / 1e18}`);
            }
        }

        // this will fail if update hasn't been called at all
        const pairObservations = await oracle.pairObservations(pairAddress, granularity - 1);
        expect(await pairObservations.length).to.eq(3);

        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by consult isn't the one updated by update
        const amountOut = await oracle.consult(tokenIn, amountIn, tokenOut);
        if (verbose) {
            console.log('amount out', amountOut.toNumber());
        }
        expect(amountOut).to.be.above(0);
    });

    it('swapFee: call oracle consult with (B, AP) pair (expected to occasionally fail)', async () => {
        const tokenIn = tokenB.address;
        const amountIn = 100000000;
        const tokenOut = targetAPToken.address;
        const pairAddress = await swapFee.pairFor(tokenIn, tokenOut);

        // there will already have been one, but make another observation
        let tx = await oracle.update(tokenIn, tokenOut);
        await tx.wait();
       
        if (verbose) {
            // output the historical observations
            for (let i = 0; i < granularity; i++) {
                let observation = await oracle.pairObservations(pairAddress, i);
                console.log(`${i}`);
                console.log(`timestamp: ${observation.timestamp}`);
                console.log(`price0Cumulative: ${observation.price0Cumulative / 1e18}`);
                console.log(`price1Cumulative: ${observation.price1Cumulative / 1e18}`);
            }
        }

        // this will fail if update hasn't been called at all
        const pairObservations = await oracle.pairObservations(pairAddress, granularity - 1);
        expect(await pairObservations.length).to.eq(3);

        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by consult isn't the one updated by update
        const amountOut = await oracle.consult(tokenIn, amountIn, tokenOut);
        if (verbose) {
            console.log('amount out', amountOut.toNumber());
        }
        expect(amountOut).to.be.above(0);
    });

    it('swapFee: call oracle consult with (B, TT) pair (expected to occasionally fail)', async () => {
        const tokenIn = tokenB.address;
        const amountIn = 10000000;
        const tokenOut = targetToken.address;
        const pairAddress = await swapFee.pairFor(tokenIn, tokenOut);

        // there will already have been one, but make another observation
        let tx = await oracle.update(tokenIn, tokenOut);
        await tx.wait();
       
        if (verbose) {
            // output the historical observations
            for (let i = 0; i < granularity; i++) {
                let observation = await oracle.pairObservations(pairAddress, i);
                console.log(`${i}`);
                console.log(`timestamp: ${observation.timestamp}`);
                console.log(`price0Cumulative: ${observation.price0Cumulative / 1e18}`);
                console.log(`price1Cumulative: ${observation.price1Cumulative / 1e18}`);
            }
        }

        // this will fail if update hasn't been called at all
        const pairObservations = await oracle.pairObservations(pairAddress, granularity - 1);
        expect(await pairObservations.length).to.eq(3);

        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by consult isn't the one updated by update, i.e. observation.timestamp == 0
        const amountOut = await oracle.consult(tokenIn, amountIn, tokenOut);
        if (verbose) {
            console.log('amount out', amountOut.toNumber());
        }
        expect(amountOut).to.be.above(0);
    });

    it('swapFee: gets the quantity out for (A, B) pair (expected to occasionally fail)', async () => {
        const percentReward = 10;
        const tokenIn = tokenA.address;
        const quantityIn = 50000000;
        const tokenOut = tokenB.address;

        // there will already have been one, but make another observation to
        // minimize the liklihood of consult missing
        let tx = await oracle.update(tokenIn, tokenOut);
        await tx.wait();

        const pairAddress = await swapFee.pairFor(tokenIn, tokenOut);
        await swapFee.addPair(percentReward, pairAddress);

        // check that getQuantityOut "if else" conditional succeeds
        expect(await swapFee.getPair(tokenIn, tokenOut)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenIn, tokenOut)).to.be.true;
         
        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by oracle.consult isn't the one updated by update, i.e. observation.timestamp == 0
        const quantityOut = await swapFee.getQuantityOut(tokenIn, quantityIn, tokenOut);
        if (verbose) {
            console.log('(A, B) quantity out', quantityOut.toNumber());
        }
        expect(quantityOut).to.be.above(0);
    });

    it('swapFee: gets the quantity out for (B, AP) pair (expected to occasionally fail)', async () => {
        const percentReward = 20;
        const tokenIn = tokenB.address;
        const quantityIn = 5000000;
        const tokenOut = targetAPToken.address;

        // there will already have been one, but make another observation to
        // minimize the liklihood of consult missing
        let tx = await oracle.update(tokenIn, tokenOut);
        await tx.wait();

        const pairAddress = await swapFee.pairFor(tokenIn, tokenOut);
        await swapFee.addPair(percentReward, pairAddress);

        // check that getQuantityOut "if else" conditional succeeds
        expect(await swapFee.getPair(tokenIn, tokenOut)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenIn, tokenOut)).to.be.true;

        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by oracle.consult isn't the one updated by update, i.e. observation.timestamp == 0
        const quantityOut = await swapFee.getQuantityOut(tokenIn, quantityIn, tokenOut);
        if (verbose) {
            console.log('(B, AP) quantity out', quantityOut.toNumber());
        }
        expect(quantityOut).to.be.above(0);
    });

    it('swapFee: gets the quantity out for (B, TT) pair (expected to occasionally fail)', async () => {
        const percentReward = 30;
        const tokenIn = tokenB.address;
        const quantityIn = 500000;
        const tokenOut = targetToken.address;

        // there will already have been one, but make another observation to
        // minimize the liklihood of consult missing
        let tx = await oracle.update(tokenIn, tokenOut);
        await tx.wait();

        const pairAddress = await swapFee.pairFor(tokenIn, tokenOut);
        await swapFee.addPair(percentReward, pairAddress);

        // check that getQuantityOut "if else" conditional succeeds
        expect(await swapFee.getPair(tokenIn, tokenOut)).to.not.eq(constants.AddressZero);
        expect(await swapFee.pairExists(tokenIn, tokenOut)).to.be.true;

        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by oracle.consult isn't the one updated by update, i.e. observation.timestamp == 0
        const quantityOut = await swapFee.getQuantityOut(tokenIn, quantityIn, tokenOut);
        if (verbose) {
            console.log('(B, TT) quantity out', quantityOut.toNumber());
        }
        expect(quantityOut).to.be.above(0);
    });

    it('swapFee: swap tokens (expected to occasionally fail)', async () => {
        // there will already have been one, but make another observation to
        // minimize the liklihood of consult missing
        let tx = await oracle.update(tokenA.address, tokenB.address);
        await tx.wait();
        tx = await oracle.update(tokenB.address, targetAPToken.address);
        await tx.wait();
        tx = await oracle.update(tokenB.address, targetToken.address);
        await tx.wait();

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
        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by oracle.consult isn't the one updated by update, i.e. observation.timestamp == 0
        tx = await swapFee.swap(account, tokenA.address, tokenB.address, 1000000000, { gasLimit });
        expect(tx).to.not.be.false;

        const newBalance = await swapFee.getBalance(account);                                                                            
        const newAP = await auraNFT.getAccumulatedAP(account);
        const newAccruedAP = (await swapFee.totalAccruedAP()).toNumber();

        if (tx !== false && verbose) {
            console.log(`previous balance was ${prevBalance} new balance is ${newBalance}`);
            console.log(`previous AP was ${prevAP} new AP is ${newAP}`);
            console.log(`previous total accrued AP was ${prevAccruedAP} new total accrued AP is ${newAccruedAP}`);
        }

        // use at most since it's possible the either the callers balance or AP is
        // unchanged depending on how userRewardDistribution is set
        expect(prevBalance).to.be.at.most(newBalance);
        expect(prevAP).to.be.at.most(newAP);
        expect(prevAccruedAP).to.be.below(newAccruedAP);
    });

    it('swapFee: withdraw tokens (expected to occasionally fail)', async () => {
        // first repeat the exact same steps as a swap so that the balances are positive

        // there will already have been one, but make another observation to
        // minimize the liklihood of consult missing
        let tx = await oracle.update(tokenA.address, tokenB.address);
        await tx.wait();
        tx = await oracle.update(tokenB.address, targetAPToken.address);
        await tx.wait();
        tx = await oracle.update(tokenB.address, targetToken.address);
        await tx.wait();

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

        // Swap A for B and collect rewards
        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by oracle.consult isn't the one updated by update, i.e. observation.timestamp == 0
        tx = await swapFee.swap(account, tokenA.address, tokenB.address, 1000000000, { gasLimit });
        expect(tx).to.not.be.false;

        // swap is done, now withdraw
       
        const prevContractBalance = await swapFee.getBalance(account);
        const prevWalletBalance = await auraToken.balanceOf(account);
        const prevTotalMined = await swapFee.totalMined();

        // Call withdraw()
        // the call occasionally fails with MISSING_HISTORICAL_OBSERVATION when the time window 
        // retrieved by oracle.consult isn't the one updated by update, i.e. observation.timestamp == 0
        tx = await swapFee.withdraw({ gasLimit });
        await tx.wait();

        const newContractBalance = await swapFee.getBalance(account);
        const newWalletBalance = await auraToken.balanceOf(account);
        const newTotalMined = await swapFee.totalMined();
        
        if (tx && verbose) {
            console.log(`previous contract balance was ${prevContractBalance} new contract balance is ${newContractBalance}`);
            console.log(`previous wallet balance was ${prevWalletBalance} new wallet balance is ${newWalletBalance}`);
            console.log(`previous total mined was ${prevTotalMined} new total mined is ${newTotalMined}`);
        } 

        expect(prevContractBalance).to.be.above(newContractBalance);
        expect(prevWalletBalance).to.be.below(newWalletBalance);
        expect(prevTotalMined).to.be.below(newTotalMined);
    });

    /*
     * WHITELIST
     */
    
    it('swapFee: whitelist contains only the added tokens', async () => {
        // These tokens have been added. 
        expect(await swapFee.whitelistContains(tokenA.address)).to.be.true;
        expect(await swapFee.whitelistContains(tokenB.address)).to.be.true;

        // This token has not been added.
        expect(await swapFee.whitelistContains(tokenC.address)).to.be.false;
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
});
