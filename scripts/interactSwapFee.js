/* 
 * @dev Interaction script for deployed Swap Fee Rewards with AP contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactSwapFee.js --network testnetBSC
 */

require ('dotenv').config();

const contracts = require('./constants/contracts');
const env = require('./constants/env');

const factoryAddress = contracts.factory[env.network];
const routerAddress = contracts.router[env.network];
const targetTokenAddress = contracts.auraToken[env.network];    // Note that targetTokenAddress == auraTokenAddress
const targetAPTokenAddress = contracts.auraLP[env.network];     // Note that targetAPTokenAddress == testTokenCAddress
const oracleAddress = contracts.oracle[env.network];
const auraTokenAddress = contracts.auraToken[env.network];
const auraNFTAddress = contracts.auraNFT[env.network];
const swapFeeAddress = contracts.swapFee[env.network];
const wbnbTokenAddress = contracts.WBNB[env.network];
const testTokenAAddress = contracts.testTokenA[env.network];
const testTokenBAddress = contracts.testTokenB[env.network];

const verbose = true;

const ownerAddress = process.env.ADDRESS;

const defaultRewardDistribution = 100;
const userRewardDistribution = 50;

const gasLimit = 9999999;
const addressZero = '0x0000000000000000000000000000000000000000';

let owner, user;
let ISwapFee, swapFee;
let router;
let factory;
let oracle;
let tokenA;
let tokenB;
let targetAPToken;
let targetToken;
let auraNFT;
let auraToken;
let tx;

/**
 * @dev Initialize the contract and call functions.
 */
async function main() {
    // initialize the script's variables
    // when finished, the owner wallet will be loaded
    await initScript(); 

    // load the contracts that'll be used in this script
    // when finished, all contracts except AuraPair are loaded
    await loadContracts();

    // initialize the state of the different contracts
    // used when importing a new contract but not necessary to 
    // run every time
    // when finished, all required checks for matching addresses and
    // updated state are done
    await initContracts();

    // perform a sanity check before calling swap to make sure that
    // swapFee.getQuantityOut works on the 3 token pairs
    await getQuantityOut(tokenA, 10000000, tokenB);
    await getQuantityOut(tokenB, 1000000, targetAPToken);
    await getQuantityOut(tokenB, 100000, targetToken);
    console.log('\n');

    // Swap the tokens.
    let amount = 1000000;
    // use the owner because they'll already have tokens minted into their address
    await swap(owner.address, testTokenAAddress, testTokenBAddress, amount);

    // Withdraw tokens.
    await withdraw();
};

/**
 * @dev Initialize the script variables.
 */
async function initScript() {
    // Load the provider.
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
    const provider = new ethers.providers.getDefaultProvider(rpc);

    // Load the wallets
    // use the owner to make changes to contract settings
    owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    if (verbose) {
        console.log('load wallet:');
        console.log(`owner address: ${owner.address}`);
        console.log('\n');
    }
}

async function loadContracts() {
    if (verbose) { console.log('load contracts:') }

    if (verbose) { console.log(`load factory: ${factoryAddress}`) }
    const IFactory = await ethers.getContractFactory('AuraFactory');
    factory = await IFactory.attach(factoryAddress).connect(owner);

    console.log("CANCEL EXECUTION IF INIT CODE HASH DOESN'T MATCH VERSION IN AURA LIBRARY");
    initCodeHash = await factory.INIT_CODE_HASH();
    console.log(`factory INIT CODE HASH is ${initCodeHash}`);

    if (verbose) { console.log(`load router: ${routerAddress}`) }
    const IRouter = await ethers.getContractFactory('AuraRouterV1');
    router = await IRouter.attach(routerAddress).connect(owner);

    if (verbose) { console.log(`load swapFee: ${swapFeeAddress}`) }
    ISwapFee = await ethers.getContractFactory('SwapFeeRewardsWithAP');
    swapFee = await ISwapFee.attach(swapFeeAddress).connect(owner);

    if (verbose) { console.log(`load oracle: ${oracleAddress}`) }
    const IOracle = await ethers.getContractFactory('Oracle');
    oracle = await IOracle.attach(oracleAddress).connect(owner);

    if (verbose) { console.log(`load auraNFT: ${auraNFTAddress}`) }
    const IAuraNFT= await ethers.getContractFactory('AuraNFT');
    auraNFT = await IAuraNFT.attach(auraNFTAddress).connect(owner);

    if (verbose) { console.log(`load tokenA: ${testTokenAAddress}`) }
    const ITestToken = await ethers.getContractFactory('TestToken');
    tokenA = await ITestToken.attach(testTokenAAddress).connect(owner);

    if (verbose) { console.log(`load tokenB: ${testTokenBAddress}`) }
    // ITestToken already loaded
    tokenB = await ITestToken.attach(testTokenBAddress).connect(owner);

    if (verbose) { console.log(`load target AP token: ${targetAPTokenAddress}`) }
    // ITestToken already loaded
    // Using ITestToken since AuraLP fails to transfer
    targetAPToken = await ITestToken.attach(targetAPTokenAddress).connect(owner);

    if (verbose) { console.log(`load target token: ${targetTokenAddress}`) }
    // ITestToken already loaded
    targetToken = await ITestToken.attach(targetTokenAddress).connect(owner);

    if (verbose) { console.log(`load AURA token: ${auraTokenAddress}`) }
    // ITestToken already loaded
    auraToken = await ITestToken.attach(auraTokenAddress).connect(owner);

    if (verbose) { console.log('\n') }
}

async function initContracts() {
    // make all the necessary calls to the factory to prepare for swapFee to swap
    await initFactory();

    // make sure swapFee is registered with the router
    if (swapFee.address != await router.swapFeeReward()) {
        if (verbose) { console.log(`registering swapFee ${short(swapFeeAddress)} with router ${short(router.address)}`) }
        await router.setSwapFeeReward(swapFee.address);
    } else {
        if (verbose) { console.log('swapFee is registered with router') }
    }

    // make sure swapFee is an auraNFT accruer
    if (!(await auraNFT.isAccruer(swapFee.address))) {
        if (verbose) { console.log(`registering swapFee ${short(swapFee.address)} as accruer with auraNFT ${short(auraNFT.address)}`) }
        await auraNFT.addAccruer(swapFee.address);
    } else {
        if (verbose) { console.log('swapFee is registered as accruer with auraNFT\n') }
    }   

    // and just to be safe, make owner an accruer too
    if (!(await auraNFT.isAccruer(owner.address))) {
        if (verbose) { console.log(`registering owner ${short(owner.Address)} as accruer with auraNFT ${short(auraNFT.address)}`) }
        await auraNFT.addAccruer(owner.address);
    } else {
        if (verbose) { console.log('owner is registered as accruer with auraNFT\n') }
    }

    // Initialize the SwapFee and it's variables.
    await initSwapFee();
}


/** 
 * @dev Confirm that the correct factory is set.
 */
async function initFactory() {
    if (verbose) {
        console.log('initialize factory:');
    }

    // make sure owner is the feeToSetter or factory setting calls will fail
    const feeToSetter = await factory.feeToSetter();
    if (owner.address != feeToSetter) {
        console.log('CANCEL EXECUTION IF OWNER IS NOT FEE TO SETTER');
    } else {
        if (verbose) {
            console.log(`owner is factory feeToSetter: ${owner.address == feeToSetter}`);
        }
    }

    // if oracle.factory != factory.address there will be a pair address mismatch during oracle update
    // we throw an error because oracle.factory is immutable and there's no reason to proceed
    const oracleFactory = await oracle.factory();
    if (factory.address != oracleFactory) {
        throw `Error: oracle.factory ${short(oracleFactory)} does not equal factory ${short(factory.address)}`;
    } else {
        if (verbose) { console.log(`oracle factory address is ${short(factory.address)}`) }
    }

    // make sure the factory oracle is set
    if (await factory.oracle() != oracle.address) {
        if (verbose) {
            console.log(`set factory oracle to ${short(oracle.address)}`);
        }
        await factory.setOracle(oracle.address);
    }
    console.log(`factory oracle address is ${short(await factory.oracle())}`);

    // create the token pairs in factory that will be used by swap, those are 
    // (A, B) which are the input and output swap values
    // (B, AP) which is the output paid to the user in AP
    // (B, TT) which is the output paid to the user in AURA (TT == Target Token)
    // Prepare the token pairs for swapping.
    if (verbose) { console.log('prepare the factory token pairs:') }
    if (verbose) { console.log('\n') }

    // Caller will swap token A for B
    await prepareFactoryPair(tokenA, tokenB); 
    if (verbose) { console.log('\n') }

    // Caller will accrue AP based on tokenB
    await prepareFactoryPair(tokenB, targetAPToken); 
    if (verbose) { console.log('\n') }

    // Caller will accrue Aura based on tokenB
    await prepareFactoryPair(tokenB, targetToken);
    if (verbose) { console.log('\n') }
}

// NOTE - use token0 and token1 to clearly differentiate from tokenA and tokenB
async function prepareFactoryPair(token0, token1) {
    if (verbose) { console.log(`prepare factory pair for tokens ${short(token0.address)} and ${short(token1.address)}:`) }
    
    // the workflow for pairs in factory must be in the following order:
    // 1. get, or create if necessary, the pair address
    // 2. get an instance of the pair so that it's functions can be called
    // 3. enable the pair in the factory so that the pair can be updated with the oracle
    // 4. transfer funds of each token to the pair so that the pair has a positive balance of each token
    // 5. mint the pair to trigger an update so that the token balances are moved to the pair's reserves
    // 6. update the pair in the oracle so that an historical observation is made which allows oracle.consult to work

    // 1. if the pair isn't created then nothing else can happen with the pair in factory
    let pairAddress = await factory.getPair(token0.address, token1.address);
    if (pairAddress == addressZero) {
        if (verbose) { console.log(`1. create pair`) }
            pairAddress = await factory.createPair(token0.address, token1.address, { gasLimit });
        if (verbose) {
            console.log(`create token pair (${short(token0.address)}, ${short(token1.address)}) with address ${pairAddress}`);
        }    
    } else {
        if (verbose) { console.log(`1. pair address is: ${pairAddress}`) }
    }

    // 2. get a pair instance so that pair functions can be called
    if (verbose) { console.log(`2. load pair: ${pairAddress}`) }
    const IPair = await ethers.getContractFactory('AuraPair');
    const pair = await IPair.attach(pairAddress).connect(owner);

    // 3. enable the pair with the oracle if it hasn't been already
    const isPairEnabled = await factory.oracleEnabled(pair.address);
    if (!isPairEnabled) {
        if (verbose) { console.log(`3. enable pair ${short(pair.address)} with oracle`) }
        await factory.enablePair(pair.address, { gasLimit });
        if (verbose) { console.log(`pair ${short(pair.address)} has been enabled with oracle`) }
    } else {
        if (verbose) { console.log(`3. pair ${short(pair.address)} is enabled with oracle`) }
    }
    
    // 4. transfer funds to the pair so that there is a positive balance to 
    //    be transferred into reserves by mint
    if (verbose) { console.log(`4. transfer funds to pair ${short(pair.address)}`) }
    const amount = 50000000;
    await transferTokenToPair(token0, amount, pair);
    await transferTokenToPair(token1, amount, pair);

    // 5. mint to move funds from balances into reserves by implicitly calling update
    if (verbose) { console.log('5. mint') }
    const reservesThreshold = 1000;     // only mint if the current reserves are below the threshold
    let [reserves0, reserves1, ] = await pair.getReserves();
    if (reserves0 < reservesThreshold || reserves1 < reservesThreshold) {
        const mintTo = owner.address;
        if (verbose) { console.log(`before mint, pair ${short(pair.address)} reserves are ${reserves0} and ${reserves1}`) }
        if (verbose) { console.log(`mint pair ${short(pair.address)} to ${short(mintTo)}`) }
        await pair.mint(owner.address, { gasLimit });
    }
    [reserves0, reserves1, ] = await pair.getReserves();
    if (verbose) { console.log(`pair ${short(pair.address)} reserves are ${reserves0} and ${reserves1}`) }

    // 6. Now that the pair has positive reserves, we can update the pair in the oracle
    if (verbose) { console.log(`6. factory update oracle with pair ${short(pair.address)}`) }
    try {
        await oracle.update(token0.address, token1.address, { gasLimit });
    } catch(error) {
        console.log('updateOracle error');
    }

    // display the observations for each granularity index
    if (verbose) {
        const localPairAddress = await swapFee.pairFor(token0.address, token1.address);
        const granularity = await oracle.granularity();
        for (let i = 0; i < granularity; i++) {
            let observation = await oracle.pairObservations(localPairAddress, i);
            console.log(`${i}`);
            console.log(`timestamp: ${observation.timestamp}`);
            console.log(`price0Cumulative: ${observation.price0Cumulative}`);
            console.log(`price1Cumulative: ${observation.price1Cumulative}`);
        }
    }
}

async function transferTokenToPair(token, amount, pair) {
    if (verbose) { console.log(`transfer ${amount} of token ${short(token.address)} to pair ${short(pair.address)}`) }
    await token.transfer(pair.address, amount, { gasLimit });
}


async function initSwapFee() {
    if (verbose) {
        console.log('initialize swapFee:');
    }

    // the workflow for the calls in this function are as follows
    // 1. make sure the swapFee factory address is correct
    // 2. make sure the swapFee oracle address is correct
    // 3. make sure the swapFee router address is set to owner.address
    // 4. set the contractRewardDistribution to give the user the full range of choices
    // 5. set the userRewardDistribution to 50, to give them 50% AURA and 50% AP payout
    // 6. make sure all the tokens that'll be used are whitelisted
    // 7. make sure that the swapFee contract has a positive balance of auraToken
    // 8. make sure all the tokens that'll be used are added to the swapFee contract 
    //    (not a numbered step in test script)

    // the order of the calls in this function don't matter too much as long as 
    // setUserRewardDistribution is called after setDefaultRewardDistribution
    
    // 1. make sure that the swap fee factory address matches the script's factory address
    if (factory.address != await swapFee.factory()) {
        if (verbose) { console.log(`1. set swapFee factory to ${short(factory.address)}`) }
        await swapFee.setFactory(factory.address);
    } else {
        if (verbose) { console.log('1. swap fee factory address matches factory address') }
    }

    // 2. make sure that the swap fee oracle address matches the factory oracle address and the script's oracle address
    // note that since factory oracle address already equals the scipt oracle address we only need to check against one
    if (oracle.address != await swapFee.oracle()) {
        if (verbose) { console.log(`2. set swapFee oracle to ${short(oracle.address)}`) }
        await swapFee.setOracle(oracle.address);
    } else {
        if (verbose) { console.log('2. swap fee oracle address matches oracle address') }
    }

    // 3. Use the owner account for swapFee.router so that the owner can call the swap function
    if (owner.address != await swapFee.router()) {
        if (verbose) { console.log('3. set swapFee router address to ${short(owner.address)}') }
        await swapFee.setRouter(owner.address);
    } else {
        if (verbose) { console.log('3. swap fee router address matches owner address') }
    }

    // 4. Set the contract default reward distribution
    // Give the user the full range of distributions to choose from
    const contractRewardDistribution = 100
    if (contractRewardDistribution != await swapFee.defaultRewardDistribution()) {
        if (verbose) { console.log(`4. set contract reward distribution to ${contractRewardDistribution}`) }
        await swapFee.setDefaultRewardDistribution(contractRewardDistribution);
    } else {
        if (verbose) { console.log(`4. contract reward distribution is ${await swapFee.defaultRewardDistribution()}`); }
    }

    // 5. set the user's default reward distribution
    // take a 50/50 split of AURA and AP, i.e. userRewardDistribution == 50
    if (userRewardDistribution != await swapFee.rewardDistribution(owner.address)) {
        if (verbose) { console.log(`5. set user reward distribution to ${userRewardDistribution}`) }

        // Call the contract as the user so that msg.sender == owner.address
        // and correct rewardDistribution is assigned.
        await swapFee.setUserDefaultDistribution(userRewardDistribution);
    } else {
        if (verbose) { console.log(`5. user reward distribution is ${await swapFee.rewardDistribution(owner.address)}`) }
    }

    // 6. make sure that the input and output tokens are whitelisted
    if (verbose) { console.log('6. whitelist tokens') }
    await whitelistAdd(tokenA.address);
    await whitelistAdd(tokenB.address);
  
    // 7.0 make sure that the swapFee contract has the right aura token set
    if (await swapFee.auraToken() != auraToken.address) {
        console.log(`set swapFee auraToken to ${auraToken.address}`);
        await swapFee.setAuraToken(auraToken.address);
    }

    // 7.1. make sure the swapFee contract has a positive AURA balance
    const swapFeeAuraBalance = '100000000000000000';
    const swapFeeAuraThreshold = '10000000000';
    console.log(`7. swapFee AURA balance is ${await auraToken.balanceOf(swapFee.address)}`);
    if (await auraToken.balanceOf(swapFee.address) < swapFeeAuraThreshold) {
        console.log(`increase swapFee AURA balance by ${swapFeeAuraBalance}`);
        await auraToken.transfer(swapFee.address, swapFeeAuraBalance);
    }

    // 8. make sure that the token pairs have been added to swapFee contract
    // Note that we need to add 3 pairs,
    // the input output pair (A, B)
    // the output to AP pair (B, AP) and
    // the output to AURA pair (B, TT) where (TT == Target Token)
    if (verbose) { console.log('8. add pairs') }
    const percentReward = 10;
    await addPair(tokenA.address, tokenB.address, percentReward);
    await addPair(tokenB.address, targetAPToken.address, percentReward);
    await addPair(tokenB.address, targetToken.address, percentReward);

    if(verbose) { console.log('\n') }
}

// only pass token addresses and not token objects
async function whitelistAdd(token) {
    if (!(await swapFee.whitelistContains(token))) {
        if (verbose) { console.log(`add token ${short(token)} to whitelist`) }
        await swapFee.whitelistAdd(token);
    } else {
        if (verbose) { console.log(`whitelist contains token ${short(token)}`) }
    }
}

// only pass token addresses and not token objects
async function addPair(tokenA, tokenB, percentReward) {
    if (!(await swapFee.pairExists(tokenA, tokenB))) {
        if (verbose) { console.log(`add tokens ${short(tokenA)} and ${short(tokenB)} to swapFee`) }
        const pair = await swapFee.pairFor(tokenA, tokenB);
        await swapFee.addPair(percentReward, pair);
        if (verbose) { console.log(`added pair ${short(await swapFee.pairFor(tokenA, tokenB))} to swapFee`) }
    } else {
        if (verbose) { console.log(`swap fee pair ${short(await swapFee.pairFor(tokenA, tokenB))} already exists`) }
    }
}

// sanity check before calling swap
// use In/Out instead of 0/1 for token names to retain swapFee.getQuantityOut parameter convention
async function getQuantityOut(tokenIn, quantityIn, tokenOut) {
    if (verbose) { console.log('check get quantity out') }
    let quantityOut = -1;
    try {
        // Try to avoid MISSING HISTORICAL OBSERVATION error
        await oracle.update(tokenIn.address, tokenOut.address, { gasLimit });
        quantityOut = await swapFee.getQuantityOut(tokenIn.address, quantityIn, tokenOut.address);
    } catch(error) {
        console.error(error);
    }

    if (verbose) {
        console.log(`get ${quantityOut} out in ${short(tokenOut.address)} for ${quantityIn} of ${short(tokenIn.address)}`)
    }
}

async function swap(account, input, output, amount) {
    if (verbose) {
        console.log(`swap ${amount} of token ${short(input)} for token ${short(output)} and credit account ${short(account)}.`);
    }

    const prevBalance = await swapFee.getBalance(account);
    const prevAP = await auraNFT.getAccumulatedAP(account);
    const prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();

    try {
        await swapFee.swap(account, input, output, amount, { gasLimit });
        
        if (verbose) {
            // Check the change in balance
            console.log(`account ${short(account)} previous balance: ${prevBalance}`);
            const balance = await swapFee.getBalance(account); 
            console.log(`account ${short(account)} new balance: ${balance}`);

            // Check the change in AP
            console.log(`account ${short(account)} previous AP: ${prevAP}`);
            const ap = await auraNFT.getAccumulatedAP(account);
            console.log(`account ${short(account)} new balance: ${ap}`);

            // Check the change in total AP
            let accruedAP = await swapFee.totalAccruedAP();
            console.log(`total accrued AP was: ${prevAccruedAP}`);
            console.log(`total accrued AP is now: ${accruedAP}`);
        }
    } catch(error) {
        console.error(error);
    }
}

async function withdraw() {
    let prevBalance = await swapFee.getBalance(owner.address);
    let prevTotalMined = await swapFee.totalMined();
    
    try {
        // Call withdraw()
        await swapFee.withdraw();

        if (verbose) {
            // Check the change in balance
            console.log(`Account ${short(owner.address)} previous balance: ${prevBalance}`);
            const balance = await swapFee.getBalance(owner.address); 
            console.log(`Account ${short(owner.address)} new balance: ${balance}`);

            // Check the change in total mined
            console.log(`Previous total mined was: ${prevTotalMined}`);
            const totalMined = await swapFee.totalMined();
            console.log(`Total mined is: ${totalMined}`);
        }
    } catch(error) {
        console.error(error);
    }
}

/**
 * @dev Shorten the given string to the first and last n characters.
 */
function short(str, n=4) {
    const first = str.slice(2, n+2);
    const last = str.slice(str.length-n, str.length);
    const newStr = `${first}...${last}`;
    return newStr;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
