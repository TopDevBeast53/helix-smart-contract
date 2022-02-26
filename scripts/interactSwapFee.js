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
const userAddress = process.env.USER_ADDRESS;

const defaultRewardDistribution = 100;
const userRewardDistribution = 50;

const gasLimit = 9999999;
const addressZero = '0x0000000000000000000000000000000000000000';

let owner, user;
let ISwapFee, swapFee;
let IAuraNFT, auraNFT;
let IRouter, router;
let tx;

/**
 * @dev Initialize the contract and call functions.
 */
async function main() {
    // Initialize the script's variables.
    await initScript(); 

    // Initialize the SwapFee and it's variables.
    await initSwapFee();

    // Initialize the factory and display it's INIT_CODE_HASH
    await initFactory();

    // Initialize the Router and register swapFee.
    await registerWithRouter();

    // Initialize the AuraNFT and register swapFee.
    await registerWithNFT();

    // Prepare the token pairs for swapping.
    if (verbose) {
        console.log('prepare token pairs for swap');
    }
    // Caller will swap token A for B
    await preparePair(testTokenAAddress, testTokenBAddress, 10); 
    // Caller will accrue AP based on tokenB
    await preparePair(testTokenBAddress, targetAPTokenAddress, 10); 
    // Caller will accrue Aura based on tokenB
    await preparePair(testTokenBAddress, targetTokenAddress, 10);

    await preswapCheck();

    // Swap the tokens.
    let amount = 1000000;
    // use the owner because they'll already have tokens minted into their address
    //await swap(owner.address, testTokenAAddress, testTokenBAddress, amount);

    /*
    // Withdraw tokens.
    await withdraw();
    */
};

/**
 * @display a series of values to confirm swap is ready to be run
 */
async function preswapCheck() {
    if (verbose) {
        console.log('preswap check');

        console.log(`token A token B pair added to swapFee: ${await swapFee.pairExists(testTokenAAddress, testTokenBAddress)}`);
        console.log(`token B target token pair added to swapFee: ${await swapFee.pairExists(testTokenBAddress, targetTokenAddress)}`);
        console.log(`token B target AP token  pair added to swapFee: ${await swapFee.pairExists(testTokenBAddress, targetAPTokenAddress)}`);

        console.log(`token A token B pair created in factory : ${await swapFee.getPair(testTokenAAddress, testTokenBAddress)}`);
        console.log(`token B target token pair created in factory: ${await swapFee.getPair(testTokenBAddress, targetTokenAddress)}`);
        console.log(`token B target AP token  pair created in factory: ${await swapFee.getPair(testTokenBAddress, targetAPTokenAddress)}`);
        
        console.log(`token A token B pair is factory enabled: ${await factory.oracleEnabled(swapFee.getPair(testTokenAAddress, testTokenBAddress))}`);
        console.log(`token B target token pair is factory enabled: ${await factory.oracleEnabled(swapFee.getPair(testTokenBAddress, targetTokenAddress))}`);
        console.log(`token B target AP token pair is factory enabled: ${await factory.oracleEnabled(swapFee.getPair(testTokenBAddress, targetAPTokenAddress))}`);

        console.log(`msg sender is router: ${ownerAddress == (await swapFee.router())}`);

        console.log(`whitelist contains tokenA: ${await swapFee.whitelistContains(testTokenAAddress)}`);
        console.log(`whitelist contains tokenB: ${await swapFee.whitelistContains(testTokenBAddress)}`);

        const pairFor = await swapFee.pairFor(testTokenAAddress, testTokenBAddress)
        console.log(`pairFor is working: ${pairFor}`);
        const pairId = await swapFee.pairOfPairIds(pairFor);
        console.log(`pairOfPairIds is working: ${pairId}`);

        const pool = await swapFee.pairsList(pairId);
        console.log(`pool is enabled: ${pool.isEnabled}`);
        console.log(`pool percent reward is set: ${pool.percentReward}`);
        console.log(`pool.pair == pair: ${pool.pair == pairFor}`);

        console.log(`refReg is set: ${await swapFee.refReg()}`);
        console.log(`quantityOut is working: ${await swapFee.getQuantityOut(testTokenBAddress, 2500000, targetTokenAddress)}`);
    }
}

/**
 * @dev Initialize the script variables.
 */
async function initScript() {
    // Load the provider.
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
    const provider = new ethers.providers.getDefaultProvider(rpc);

    // Load the wallets.
    owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    user = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);

    if (verbose) {
        console.log(`owner address: ${owner.address}`);
        console.log(`user address: ${user.address}`);
    }
}

async function initSwapFee() {
    if (verbose) {
        console.log('initialize swap fee contract');
    }

    // Create the swapFee instance.
    const swapFeeJson = require('../build/contracts/SwapFeeRewardsWithAP.json');
    const swapFeeAbi = swapFeeJson.abi;
    ISwapFee = await ethers.getContractFactory('SwapFeeRewardsWithAP');
    swapFee = await ISwapFee.attach(swapFeeAddress).connect(owner);

    // Use the owner account as though it's the router for testing swapFee in isolation.
    const prevRouterAddress = await swapFee.router();
    if (prevRouterAddress != owner.address) {
        if (verbose) {
            console.log('use the owner address as the router');
        }
        tx = await swapFee.setRouter(owner.address);
        await tx.wait();
    }
    if (verbose) {
        console.log(`using owner address ${short(owner.address)} as the router`);
    }

    // Set the contract default reward distribution
    // Give the user full range of distributions to choose from, i.e. defaultRewardDistribution == 100
    const prevDefaultRewardDistribution = await swapFee.defaultRewardDistribution();
    if (prevDefaultRewardDistribution != defaultRewardDistribution) {
        if (verbose) {
            console.log(`set default reward distribution to ${defaultRewardDistribution}`);
        }
        tx = await swapFee.setDefaultRewardDistribution(defaultRewardDistribution);
        await tx.wait();
    }
    const newDefaultRewardDistribution = await swapFee.defaultRewardDistribution();
    if (verbose) {
        console.log(`contract default reward distribution is ${defaultRewardDistribution}`);
    }

    // Set the users default reward distribution
    // Take a 50/50 split of AURA and AP, i.e. userRewardDistribution == 50
    const prevRewardDistribution = await swapFee.rewardDistribution(user.address);
    if (prevRewardDistribution != userRewardDistribution) {
            if (verbose) {
            console.log(`set user reward distribution to ${userRewardDistribution}`);
        }
        // Connect user so that msg.sender == user and correct rewardDistribution is assigned.
        const localSwapFee = await ISwapFee.attach(swapFeeAddress).connect(user);

        tx = await localSwapFee.setUserDefaultDistribution(userRewardDistribution);
        await tx.wait();
    }
    const newRewardDistribution = await swapFee.rewardDistribution(user.address);
    if (verbose) {
        console.log(`user reward distribution is ${newRewardDistribution}`);
    }
}

/** 
 * @dev Confirm that the correct factory is set.
 */
async function initFactory() {
    if (verbose) {
        console.log('initialize factory and output INIT CODE HASH');
    }

    IFactory = await ethers.getContractFactory('AuraFactory');
    factory = await IFactory.attach(factoryAddress).connect(owner);

    const prevFactory = await swapFee.factory();
    if (prevFactory != factoryAddress) {
        if (verbose) {
            console.log(`set swapFee factory to ${short(factoryAddress)}`);
        }
        tx = await swapFee.setFactory(factoryAddress);
        await tx.wait();
    }

    const prevOracle = await factory.oracle();
    if (prevOracle != oracleAddress) {
        if (verbose) {
            console.log(`set factory oracle to ${short(oracleAddress)}`);
        }
        tx = await factory.setOracle(oracleAddress);
        await tx.wait();
    }

    // make sure factory oracle == swapfee oracle
    const swapFeeOracle = await swapFee.oracle();
    const factoryOracle = await factory.oracle();
    if (factoryOracle != swapFeeOracle) {
        if (verbose) {
            console.log(`set swapFee oracle to factory oracle`);
        }
        await swapFee.setOracle(factoryOracle);
    }

    if (verbose) {
        const newFactoryAddress = await swapFee.factory();
        const newOracleAddress = await factory.oracle();
        initCodeHash = await factory.INIT_CODE_HASH();
        console.log(`factory feeToSetter is ${short(await factory.feeToSetter())}`);
        console.log(`swapFee factory address is ${short(newFactoryAddress)}`);
        console.log('CONFIRM THIS MATCHES THE INIT CODE HASH IN AURA LIBRARY');
        console.log(`factory INIT CODE HASH is ${initCodeHash}`);
        console.log(`factory oracle address is ${short(newOracleAddress)}`);
        console.log(`swap fee oracle ${short(await swapFee.oracle())} equals factory oracle ${short(await factory.oracle())}`);
    }
}

/** 
 * @dev Confirm that swapFee contract is registered with Router.
 */
async function registerWithRouter() {
    if (verbose) {
        console.log('initialize router and register swap fee');
    }

    IRouter = await ethers.getContractFactory('AuraRouterV1');
    router = await IRouter.attach(routerAddress).connect(owner);

    let registeredAddress = await router.swapFeeReward();
    if (registeredAddress != swapFeeAddress) {
        if (verbose) {
            console.log(`registering swapFee ${short(swapFeeAddress)} with router ${short(routerAddress)}`);
        }
        tx = await router.setSwapFeeReward(swapFeeAddress);
        await tx.wait();
    }
    registeredAddress = await router.swapFeeReward();
    if (verbose) {
        console.log(`router address: ${short(router.address)}`);
        console.log(`swapFee ${short(swapFeeAddress)} is registered with router`);
    }
}

/**
 * @dev Confirm that swapFee contract is registered with auraNFT as an accruer.
 */
async function registerWithNFT() {
    if (verbose) {
        console.log('initialize aura nft and register swap fee');
    }

    // Create the auraNFT instance and add an accruer.
    IAuraNFT = await ethers.getContractFactory('AuraNFT');
    auraNFT = await IAuraNFT.attach(auraNFTAddress).connect(owner);

    let accruer = swapFeeAddress;
    let isAccruer = await auraNFT.isAccruer(accruer);
    if (!isAccruer) {
        if (verbose) {
            console.log(`Adding ${short(accruer)} as an AuraNFT accruer`);
        }
        tx = await auraNFT.addAccruer(accruer);
        await tx.wait();
    }
    isAccruer = await auraNFT.isAccruer(accruer);
    if (verbose) {
        console.log(`aura nft address: ${short(auraNFT.address)}`);
        console.log(`${short(accruer)} is registered as auraNFT accruer: ${isAccruer}`);
    }
}

/**
 * @dev Prepare the token pair for swapping (auraTokenAddress, wbnbTokenAddress) by making 
 *      sure that they're added the pair exists and is whitelisted.
 */
async function preparePair(tokenAAddress, tokenBAddress, percentReward) {
    // Add the token pair if necessary.
    let pairExists = await getPairExists(tokenAAddress, tokenBAddress);
    if (!pairExists) {
        await addPair(tokenAAddress, tokenBAddress, percentReward);
    }

    const pairCreated = await swapFee.getPair(tokenAAddress, tokenBAddress);
    console.log("PAIR CREATED", pairCreated);
    if (pairCreated == addressZero) {
        await createPair(tokenAAddress, tokenBAddress); 
    }
    
    // Use the factory created pair to search
    let pairEnabled = await factory.oracleEnabled(pairCreated);
    if (!pairEnabled) {
        enablePair(pairCreated);    
    }

    // Instantiate token contracts for their transfer functions
    console.log("load token contracts");
    const IToken = await ethers.getContractFactory('TestToken');
    const tokenA = await IToken.attach(tokenAAddress).connect(owner);
    const tokenB = await IToken.attach(tokenAAddress).connect(owner);

    // Send each token to pair using factory createPair address
    // Assumes the caller has a sufficient balance
    console.log('transfer funds to pair');
    const transferAmount = '50000000000000000';
    await tokenA.transfer(pairCreated, transferAmount);
    await tokenB.transfer(pairCreated, transferAmount);
    
    // Instantiate the pair contract for it's mint function
    // which is used to move the funds from the pair contract's balance into it's reserves
    console.log('load pair contract');
    const IPair = await ethers.getContractFactory('AuraPair');
    const pair = await IPair.attach(pairCreated).connect(owner);
   
    // Call mint to move funds into pair contract's reserves by implicitly calling pair.update
    console.log('mint to owner address');
    await pair.mint(ownerAddress, { gasLimit });
   
    // Now that the pair has positive reserves we can update the pair in the oracle
    console.log('enable pair with oracle');
    pairEnabled = await factory.oracleEnabled(pairCreated);
    if (pairEnabled) {
        updateOracle(pairCreated);
    }
    
    // Add tokenA to the whitelist if necessary.
    let whitelistContainsA = await whitelistContains(tokenAAddress);
    if(!whitelistContainsA) {
        await whitelistAdd(tokenAAddress); 
    }

    // Add tokenB to the whitelist if necessary.
    let whitelistContainsB = await whitelistContains(tokenBAddress);
    if(!whitelistContainsB) {
        await whitelistAdd(tokenBAddress); 
    }
}

async function enablePair(pair) {
    if (verbose) {
        console.log(`enable pair`);
    }
    await factory.enablePair(pair);
}

async function updateOracle(pair) {
    if (verbose) {
        console.log(`update pair with oracle`);
    }
    await factory.updateOracle(pair, { gasLimit });
}

/**
 * @dev Returns true if the pair exists and false otherwise.
 */
async function getPairExists(tokenAAddress, tokenBAddress) {
    const pairExists = await swapFee.pairExists(tokenAAddress, tokenBAddress);
    if (verbose) { 
        console.log(`token pair (${short(tokenAAddress)}, ${short(tokenBAddress)}) exists: ${pairExists}`);
    }
    return pairExists;
}

/**
 * @dev Adds the (tokenA, tokenB) swap pair.
 */
async function addPair(tokenA, tokenB, percentReward) {
    const pairAddress = await swapFee.pairFor(tokenA, tokenB)

    // register the pair with the swapFee
    if (verbose) { console.log('add pair'); }
    const addPairTx = await swapFee.addPair(percentReward, pairAddress);

    if (verbose) {
        console.log(`token pair (${short(tokenA)}, ${short(tokenB)}) address: ${pairAddress}`);
        console.log(`added token pair (${short(tokenA)}, ${short(tokenB)}) tx hash: ${addPairTx.hash}`);
    }
}

async function createPair(tokenA, tokenB) {
    // register the pair with the factory
    if (verbose) { console.log(`create pair`); }
    pairAddress = await factory.createPair(tokenA, tokenB, { gasLimit });

    if (verbose) {
        console.log(`create token pair (${short(tokenA)}, ${short(tokenB)}) address ${short(pairAddress)}`);
    }
}



/**
 * @dev Returns true if the token is in the whitelist and false otherwise.
 */
async function whitelistContains(token) {
    const contains = await swapFee.whitelistContains(token);
    if (verbose && !contains) {
        console.log(`whitelist contains token ${short(token)}: ${contains}`);
    }
    return contains;
}

/**
 * @dev Add the token to the whitelist.
 */
async function whitelistAdd(token) {
    const wasAdded = await swapFee.whitelistAdd(token);
    if (verbose) { 
        console.log(`token ${short(token)} was added to whitelist`); 
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

/**
 * @dev Perform a token swap.
 */
async function swap(account, input, output, amount) {
    if (verbose) {
        console.log(`swap ${amount} of token ${short(input)} for token ${short(output)} and credit account ${short(account)}.`);
    }

    console.log("ACCOUNT", account);
    let prevBalance = await swapFee.getBalance(account);
    let prevAP = await auraNFT.getAccumulatedAP(account);
    let prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();
    console.log("PREV BALANCE", prevBalance);
    console.log("PREV AP     ", prevAP);
    console.log("PREV ACCR AP", prevAccruedAP);

    tx = await swapFee.swap(account, input, output, amount, { gasLimit });
    await tx.wait();
    
    if (verbose) {
        // Swap was successful.
        if (tx) {
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
        } else {
            console.log('swap failed');        
        }
    }
}

/*
 * @dev Perform a withdrawl.
 */
async function withdraw() {
    swapFee = await ISwapFee.attach(Address.SwapFee).connect(user);

    let prevBalance = await swapFee.getBalance(Address.User);
    let prevTotalMined = await swapFee.totalMined();

    // Call withdraw()
    tx = await swapFee.withdraw();
    await tx.wait();

    if (verbose) {
        if (tx) {
            // Check the change in balance
            console.log(`Account ${short(Address.User)} previous balance: ${prevBalance}`);
            const balance = await swapFee.getBalance(Address.User); 
            console.log(`Account ${short(Address.User)} new balance: ${balance}`);

            // Check the change in total mined
            console.log(`Previous total mined was: ${prevTotalMined}`);
            const totalMined = await swapFee.totalMined();
            console.log(`Total mined is: ${totalMined}`);
        } else {
            console.log('Withdraw failed');
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
