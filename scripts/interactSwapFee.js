/* 
 * @dev Interaction script for deployed Swap Fee Rewards with AP contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactSwapFee.js --network testnetBSC
 */

require ('dotenv').config();

const verbose = true;

let Address, overrides;
let owner, user;
let router, market, auction;
let tokenA, tokenB, tokenC;
let ISwapFee, swapFee;
let IAuraNFT, auraNFT;
let tx, nonce;
let gasLimit;

/**
 * @dev Initialize the contract and call functions.
 */
async function main() {
    // Initialize the script's variables.
    await initScript(); 

    // Initialize the AuraNFT and it's variables.
    await initAuraNFT();

    // Initialize the SwapFee and it's variables.
    await initSwapFee();
   
    // Prepare the token pair for swapping.
    await preparePair(tokenA, tokenB); 
    await preparePair(tokenA, tokenC); 
    await preparePair(tokenB, tokenC); 
   
    // Swap the tokens.
    // Note that tokenA and tokenB are already assigned.
    // Note that tokenA is passed twice on purpose to simplify output estimates. 
    let account = await user.getAddress();
    let amount = 15000000;
    await swap(account, tokenA, tokenB, amount);

    amount = 10000;
    await accrueAPFromMarket(account, tokenC, amount);
    await accrueAPFromAuction(account, tokenC, amount);

    // Withdraw tokens.
    await withdraw();
};

/**
 * @dev Initialize the script variables.
 */
async function initScript() {
    // Convenience object for getting the addresses of accounts and contracts.
    Address = {
        Owner: '0x59201fb8cb2D61118B280c8542127331DD141654',
        User: '0x697419d2B31844ad7Fa4646499f8B81de79D2eB1',
        SwapFee: '0xC06a683871fe5B8Bcd098416Cfa5915835440107',          // Deployed
        Factory: '0xe1cf8d44bb47b8915a70ea494254164f19b7080d',          // Deployed
        Router: '0x38433227c7a606ebb9ccb0acfcd7504224659b74',           // Deployed
        AuraToken: '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135',        // Deployed - Also used for TargetToken
        WbnbToken: '0xae13d989dac2f0debff460ac112a837c89baa7cd',         // Deployed
        AuraNFT: '0x6f567929bac6e7db604795fC2b4756Cc27C0e020',          // Deployed
        TargetAPToken: '0x9903Ee9e2a67D82A2Ba37D087CC8663F9592716E',    // Deployed
        Market: '0xB69888c53b9c4b779E1bEAd3A5019a388Bc072e9',           // Fake
        Auction: '0xdCe96794ba50b147C60F35D614e76451062fBce7',          // Fake
    }

    // Load the provider.
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
    const provider = new ethers.providers.getDefaultProvider(rpc);

    // Load the wallets.
    owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    user = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);

    gasLimit = 6721975;

    // Set the tokens to test.
    tokenA = Address.AuraToken;
    tokenB = Address.WbnbToken;
    tokenC = Address.TargetAPToken;

    // Create the auraNFT instance and add an accruer.
    IAuraNFT = await ethers.getContractFactory('AuraNFT');
    auraNFT = await IAuraNFT.attach(Address.AuraNFT).connect(owner);

    // Create the swapFee instance.
    const swapFeeJson = require('../build/contracts/SwapFeeRewardsWithAP.json');
    const swapFeeAbi = swapFeeJson.abi;
    ISwapFee = await ethers.getContractFactory('SwapFeeRewardsWithAP');

    // Set the contract's dependents.
    swapFee = await ISwapFee.attach(Address.SwapFee).connect(owner);
}

async function initAuraNFT() {
    let accruer = Address.SwapFee;
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
        console.log(`${short(accruer)} is an accruer: ${isAccruer}`);
    }
}

async function initSwapFee() {
    // NOTE - These function-worthy blocks fail when wrapped into functions.
    // Appears to be a result of asynchronous execution.
    // Simple solution is to keep them all in single function.

    // Set the factory.
    let factoryAddress = await swapFee.factory();
    if (factoryAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set factory address to ${Address.Factory}`);
        }
        tx = await swapFee.setFactory(Address.Factory);
        await tx.wait();
    }
    factoryAddress = await swapFee.factory();
    if (verbose) {
        console.log(`Factory address is ${factoryAddress}`);
    } 
 
    // Set the router.
    let routerAddress = Address.Owner;
    let prevRouterAddress = await swapFee.router();
    if (prevRouterAddress != routerAddress) {
        if (verbose) {
            console.log(`Set router address to ${routerAddress}`);
        }
        tx = await swapFee.setRouter(routerAddress);
        await tx.wait();
    }
    routerAddress = await swapFee.router();
    if (verbose) {
        console.log(`Router address is ${routerAddress}`);
    } 

    // Set the target token
    let targetTokenAddress = await swapFee.targetToken();
    if (targetTokenAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set target token address to ${Address.AuraToken}`);
        }
        tx = await swapFee.setTargetToken(Address.AuraToken);
        await tx.wait();
    }
    targetTokenAddress = await swapFee.targetToken();
    if (verbose) {
        console.log(`Target token address is ${targetTokenAddress}`);
    } 

    // Set the target AP token
    let targetAPTokenAddress = await swapFee.targetAPToken();
        if (targetAPTokenAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set target AP token address to ${Address.TargetAPToken}`);
        }
        tx = await swapFee.setTargetAPToken(Address.TargetAPToken);
        await tx.wait();
    }
    targetAPTokenAddress = await swapFee.targetAPToken();
    if (verbose) {
        console.log(`Target AP token address is ${targetAPTokenAddress}`);
    } 

    // Set the aura token
    let auraTokenAddress = await swapFee.auraToken();
    if (auraTokenAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set aura token address to ${Address.AuraToken}`);
        }
        tx = await swapFee.setAuraToken(Address.AuraToken);
        await tx.wait();
    }
    auraTokenAddress = await swapFee.auraToken();
    if (verbose) {
        console.log(`Aura token address is ${auraTokenAddress}`);
    } 

    // Set the aura NFT
    let auraNFTAddress = await auraNFT.address;
    let prevAuraNFTAddress = await swapFee.auraNFT();
    if (prevAuraNFTAddress != auraNFTAddress) {
        if (verbose) {
            console.log(`Set aura NFT address to ${auraNFTAddress}`);
        }
        tx = await swapFee.setAuraNFT(auraNFTAddress);
        await tx.wait();
    }
    auraNFTAddress = await swapFee.auraNFT();
    if (verbose) {
        console.log(`Aura NFT address is ${auraNFTAddress}`);
    } 

    // Set the market
    let marketAddress = Address.Owner;
    let prevMarketAddress = await swapFee.market();
    if (prevMarketAddress != marketAddress) {
        if (verbose) {
            console.log(`Set market address to ${marketAddress}`);
        }
        tx = await swapFee.setMarket(marketAddress);
        await tx.wait();
    }
    marketAddress = await swapFee.market();
    if (verbose) {
        console.log(`Market address is ${marketAddress}`);
    } 

    // Set the auction
    let auctionAddress = Address.Owner;
    let prevAuctionAddress = await swapFee.auction();
    if (prevAuctionAddress != auctionAddress) {
        if (verbose) {
            console.log(`Set auction address to ${auctionAddress}`);
        }
        tx = await swapFee.setAuction(auctionAddress);
        await tx.wait();
    }
    auctionAddress = await swapFee.auction();
    if (verbose) {
        console.log(`Auction address is ${auctionAddress}`);
    } 

    // Set the contract default reward distribution
    // If this == 0, then the user can't gain a balance and there will be nothing to withdraw. 
    // Hence, this enables testing that withdraw works.
    let defaultRewardDistribution = 50;
    prevDefaultRewardDistribution = await swapFee.defaultRewardDistribution();
    if (prevDefaultRewardDistribution != defaultRewardDistribution) {
        if (verbose) {
            console.log(`Set default reward distribution to ${defaultRewardDistribution}`);
        }
        tx = await swapFee.setDefaultRewardDistribution(defaultRewardDistribution);
        await tx.wait();
    }
    defaultRewardDistribution = await swapFee.defaultRewardDistribution();
    if (verbose) {
        console.log(`Contract default reward distribution is ${defaultRewardDistribution}`);
    }

    // Set the users default reward distribution
    // If this == 0, then the user can't gain a balance and there will be nothing to withdraw. 
    // Hence, this enables testing that withdraw works.
    let rewardDistribution = 20;
    let prevRewardDistribution = await swapFee.rewardDistribution[Address.User];
    if (rewardDistribution != 0 && prevRewardDistribution != rewardDistribution) {
        if (verbose) {
            console.log(`Set user reward distribution to ${rewardDistribution}`);
        }
        tx = await swapFee.setUserDefaultDistribution(rewardDistribution);
        await tx.wait();
    }
    rewardDistribution = await swapFee.rewardDistribution[Address.User];
    if (verbose) {
        console.log(`User reward distribution is ${rewardDistribution}`);
    }
}

/**
 * @dev Prepare the token pair for swapping (tokenA, tokenB) by making 
 *      sure that they're added the pair exists and is whitelisted.
 */
async function preparePair(tokenA, tokenB) {
    if (verbose) {
        console.log('Prepare tokens for swap');
    } 

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
        console.log(`Token pair (${short(tokenA)}, ${short(tokenB)}) exists: ${pairExists}`);
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
        console.log(`Token pair (${short(tokenA)}, ${short(tokenB)}) address: ${pairAddress}`);
        console.log(`Added token pair (${short(tokenA)}, ${short(tokenB)}) tx hash: ${addPairTx.hash}`);
    }

    // Aura-Bnb pair address: 0x046c1E7Dc3C06502195E014E55BC492079731650
    // Aura-Bnb add pair tx hash: 0x4907ea0c1490295fed88d9f7424d946c297d8a1fd3c7a07e1a24d54e3864f7eb
}

/**
 * @dev Returns true if the token is in the whitelist and false otherwise.
 */
async function whitelistContains(token) {
    const contains = await swapFee.whitelistContains(token);
    if (verbose) {
        console.log(`Whitelist contains token ${short(token)}: ${contains}`);
    }
    return contains;
}

/**
 * @dev Add the token to the whitelist.
 */
async function whitelistAdd(token) {
    const wasAdded = await swapFee.whitelistAdd(token);
    if (verbose) { 
        console.log(`Token ${short(token)} was added to whitelist`); 
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
        console.log(`Swap ${amount} of token ${short(input)} for token ${short(output)} and credit account ${short(account)}.`);
    }

    let prevBalance = await swapFee.getBalance(account);
    let prevAP = await auraNFT.getAccumulatedAP(account);
    let prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();

    tx = await swapFee.swap(account, input, output, amount, { gasLimit: 6721975 });
    await tx.wait();
    
    if (verbose) {
        // Swap was successful.
        if (tx) {
            // Check the change in balance
            console.log(`Account ${short(account)} previous balance: ${prevBalance}`);
            const balance = await swapFee.getBalance(account); 
            console.log(`Account ${short(account)} new balance: ${balance}`);

            // Check the change in AP
            console.log(`Account ${short(account)} previous AP: ${prevAP}`);
            const ap = await auraNFT.getAccumulatedAP(account);
            console.log(`Account ${short(account)} new balance: ${ap}`);

            // Check the change in total AP
            let accruedAP = await swapFee.totalAccruedAP();
            console.log(`Total accrued AP was: ${prevAccruedAP}`);
            console.log(`Total accrued AP is now: ${accruedAP}`);
        } else {
            console.log('Swap failed');        
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

/**
 * @dev Calls accrueAPFromMarket and checks the output.
 */
async function accrueAPFromMarket(account, tokenIn, quantityIn) {
    if (verbose) {
        console.log(`Accrue AP in ${quantityIn} of token ${short(tokenIn)} for account ${short(account)} from market`);
    }
    
    swapFee = ISwapFee.attach(Address.SwapFee).connect(owner);
    
    let prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();

    tx = await swapFee.accrueAPFromMarket(account, tokenIn, quantityIn, { gasLimit: gasLimit });
    await tx.wait();

    // Check whether the accrued AP increased.
    let accruedAP = await swapFee.totalAccruedAP();
    if (verbose) {
        console.log(`Total accrued AP was: ${prevAccruedAP}`);
        console.log(`Total accrued AP is now: ${accruedAP}`);
    }
}

/**
 * @dev Calls accrueAPFromAuction and checks the output.
 */
async function accrueAPFromAuction(account, tokenIn, quantityIn) {
    if (verbose) {
        console.log(`Accrue AP in ${quantityIn} of token ${short(tokenIn)} for account ${short(account)} from auction`);
    }
    
    swapFee = ISwapFee.attach(Address.SwapFee).connect(owner);
    
    let prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();

    tx = await swapFee.accrueAPFromAuction(account, tokenIn, quantityIn, { gasLimit: gasLimit });
    await tx.wait();

    // Check whether the accrued AP increased.
    let accruedAP = await swapFee.totalAccruedAP();
    if (verbose) {
        console.log(`Total accrued AP was: ${prevAccruedAP}`);
        console.log(`Total accrued AP is now: ${accruedAP}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
