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
const targetAPTokenAddress = contracts.auraLP[env.network];
const oracleAddress = contracts.oracle[env.network];
const auraTokenAddress = contracts.auraToken[env.network];
const auraNFTAddress = contracts.auraNFT[env.network];
const swapFeeAddress = contracts.swapFee[env.network];
const wbnbTokenAddress = contracts.WBNB[env.network];

const verbose = true;

const ownerAddress = process.env.ADDRESS;
const userAddress = process.env.USER_ADDRESS;

const defaultRewardDistribution = 50;
const userRewardDistribution = 20;

let owner, user;
let tokenA, tokenB, tokenC;
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

    // Initialize the Router and register swapFee.
    await registerWithRouter();

    // Initialize the AuraNFT and register swapFee.
    await registerWithNFT();
      
    // Prepare the token pairs for swapping.
    if (verbose) {
        console.log('prepare token pairs for swap');
    }
    await preparePair(tokenA, tokenB); 
    await preparePair(tokenA, tokenC); 
    await preparePair(tokenB, tokenC); 
  
    // Swap the tokens.
    // Note that tokenA and tokenB are already assigned.
    let account = await user.getAddress();
    let amount = 15000000;
    await swap(account, tokenA, tokenB, amount);

    // Withdraw tokens.
    await withdraw();
};

/**
 * @dev Initialize the script variables.
 */
async function initScript() {
    // Set the tokens to test.
    tokenA = auraTokenAddress;
    tokenB = wbnbTokenAddress;
    tokenC = targetAPTokenAddress;
    
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

    console.log("TOKEN A", tokenA);
    console.log("TOKEN B", tokenB);
    const pair = await swapFee.pairFor(tokenA, tokenB);
    console.log("PAIR", pair);
    const pairId = await swapFee.pairOfPairIds(pair);
    console.log("PAIR ID", pairId);
    const pool = await swapFee.pairsList(pairId);
    console.log("POOL", pool);
    const localFactoryAddress = await swapFee.factory();
    console.log("FACTORY", localFactoryAddress);
    const swapFeeAmount = await swapFee.getSwapFee(tokenA, tokenB);
    console.log("SWAP FEE AMOUNT", swapFeeAmount);

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
    // If this == 0, then the user can't gain a balance and there will be nothing to withdraw. 
    // Hence, this enables testing that withdraw works.
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
    // If this == 0, then the user can't gain a balance and there will be nothing to withdraw. 
    // Hence, this enables testing that withdraw works.
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
 * @dev Prepare the token pair for swapping (tokenA, tokenB) by making 
 *      sure that they're added the pair exists and is whitelisted.
 */
async function preparePair(tokenA, tokenB) {
    // Add the (tokenA, tokenB) pair if necessary.
    let pairExists = await getPairExists(tokenA, tokenB);
    if (!pairExists) {
        const percentReward = 10
        await addPair(tokenA, tokenB, percentReward);
    }
   
    // Add tokenA to the whitelist if necessary.
    let whitelistContainsA = await whitelistContains(tokenA);
    if(!whitelistContainsA) {
        await whitelistAdd(tokenA); 
    }

    // Add tokenB to the whitelist if necessary.
    let whitelistContainsB = await whitelistContains(tokenB);
    if(!whitelistContainsB) {
        await whitelistAdd(tokenB); 
    }
}

/**
 * @dev Returns true if the pair exists and false otherwise.
 */
async function getPairExists(tokenA, tokenB) {
    const pairExists = await swapFee.pairExists(tokenA, tokenB);
    if (verbose) { 
        console.log(`token pair (${short(tokenA)}, ${short(tokenB)}) exists: ${pairExists}`);
    }
    return pairExists;
}

/**
 * @dev Adds the (tokenA, tokenB) swap pair.
 */
async function addPair(tokenA, tokenB, percentReward) {
    const pairAddress = await swapFee.pairFor(tokenA, tokenB)
    const addPairTx = await swapFee.addPair(percentReward, pairAddress);

    if (verbose) {
        console.log(`token pair (${short(tokenA)}, ${short(tokenB)}) address: ${pairAddress}`);
        console.log(`added token pair (${short(tokenA)}, ${short(tokenB)}) tx hash: ${addPairTx.hash}`);
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

    let prevBalance = await swapFee.getBalance(account);
    let prevAP = await auraNFT.getAccumulatedAP(account);
    let prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();
    console.log("PREV BALANCE", prevBalance);
    console.log("PREV AP     ", prevAP);
    console.log("PREV ACCR AP", prevAccruedAP);

    tx = await swapFee.swap(account, input, output, amount, { gasLimit: 9999999 });
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
