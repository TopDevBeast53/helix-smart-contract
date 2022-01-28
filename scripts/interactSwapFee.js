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
let tokenA, tokenB;
let ISwapFee, swapFee;
let tx, nonce;
let gasLimit;

/**
 * @dev Initialize the contract and call functions.
 */
async function main() {
    // Initialize the script's variables.
    await init(); 
   
    // Prepare the token pair for swapping.
    await preparePair(tokenA, tokenB); 
   
    // Swap the tokens.
    // Note that tokenA and tokenB are already assigned.
    let account = await user.getAddress();
    let amount = 100;
    await swap(account, tokenA, tokenB, amount);

    //await accrueAPFromMarket(account, tokenA, amount);

    // Withdraw tokens.
    //await withdraw();
};

/**
 * @dev Initialize the script variables.
 */
async function init() {
    // Convenience object for getting the addresses of accounts and contracts.
    Address = {
        Owner: '0x59201fb8cb2D61118B280c8542127331DD141654',
        User: '0x697419d2B31844ad7Fa4646499f8B81de79D2eB1',
        SwapFee: '0xAd34Cac48cAC8e8dD0b46134f796F983ACd10bb6',          // Deployed
        Factory: '0xe1cf8d44bb47b8915a70ea494254164f19b7080d',          // Deployed
        Router: '0x38433227c7a606ebb9ccb0acfcd7504224659b74',           // Deployed
        AuraToken: '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135',        // Deployed - Also used for TargetToken
        BnbToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',         // Deployed
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

    //router = provider.getSigner(Address.Router);
    router = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    market = provider.getSigner(Address.Market);
    auction = provider.getSigner(Address.Auction);

    // Create the swapFee instance.
    const swapFeeJson = require('../build/contracts/SwapFeeRewardsWithAP.json');
    const swapFeeAbi = swapFeeJson.abi;
    ISwapFee = await ethers.getContractFactory('SwapFeeRewardsWithAP');

    gasLimit = 6721975;

    // Set the tokens to test.
    tokenA = Address.AuraToken;
    tokenB = Address.BnbToken;

    // Set the contract's dependents.
    swapFee = await ISwapFee.attach(Address.SwapFee).connect(owner);
    nonce = await network.provider.send('eth_getTransactionCount', [Address.Owner, "latest"]);

    // NOTE - These function-worthy blocks fail when wrapped into functions.
    // Appears to be a result of asynchronous execution.

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
    let routerAddress = await swapFee.router();
    if (routerAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set router address to ${Address.Router}`);
        }
        tx = await swapFee.setRouter(Address.Router);
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
    let auraNFTAddress = await swapFee.auraNFT();
    if (auraNFTAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set aura NFT address to ${Address.AuraNFT}`);
        }
        tx = await swapFee.setAuraNFT(Address.AuraNFT);
        await tx.wait();
    }
    auraNFTAddress = await swapFee.auraNFT();
    if (verbose) {
        console.log(`Aura NFT address is ${auraNFTAddress}`);
    } 

    // Set the market
    let marketAddress = await swapFee.market();
    if (marketAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set market address to ${Address.Market}`);
        }
        tx = await swapFee.setMarket(Address.Market);
        await tx.wait();
    }
    marketAddress = await swapFee.market();
    if (verbose) {
        console.log(`Market address is ${marketAddress}`);
    } 

    // Set the auction
    let auctionAddress = await swapFee.auction();
    if (auctionAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log(`Set auction address to ${Address.Auction}`);
        }
        tx = await swapFee.setAuction(Address.Auction);
        await tx.wait();
    }
    auctionAddress = await swapFee.auction();
    if (verbose) {
        console.log(`Auction address is ${auctionAddress}`);
    } 
}

/**
 * @dev Prepare the token pair for swapping (tokenA, tokenB) by making 
 *      sure that they're added the pair exists and is whitelisted.
 */
async function preparePair(tokenA, tokenB) {
    swapFee = ISwapFee.attach(Address.SwapFee).connect(owner);

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
        console.log(`(${short(tokenA)}, ${short(tokenB)}) pair exists: ${pairExists}`);
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
        console.log(`(${short(tokenA)}, ${short(tokenB)}) pair address: ${pairAddress}`);
        console.log(`(${short(tokenA)}, ${short(tokenB)}) add pair tx hash: ${addPairTx.hash}`);
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
        console.log(`whitelist contains ${short(token)}: ${contains}`);
    }
    return contains;
}

/**
 * @dev Add the token to the whitelist.
 */
async function whitelistAdd(token) {
    const wasAdded = await swapFee.whitelistAdd(token, overrides);
    if (verbose) { 
        console.log(`${short(token)} was added to whitelist`); 
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
        console.log(`Swap ${amount} of ${short(input)} for ${short(output)} and credit ${short(account)}.`);
    }

    swapFee = await ISwapFee.attach(Address.SwapFee).connect(router);

    // Fails because msg.sender == owner.
    // Possible solutions are impersonating router using hardhat_impersonateAccount
    // or writing a wrapper contract to mimic router.
    // https://ethereum.stackexchange.com/questions/107190/impersonating-a-contract-when-calling-another-in-tests-using-ether-js
    tx = await swapFee.swap(account, input, output, amount, { gasLimit: 6721975 });
    await tx.wait();
    
    /*
    // Swap was successful.
    if (verbose) {
        if (result && event != undefined) {
            // Check that balance[account] increased
            const balance = await swapFee.getBalance(account); 
            console.log(`balance: ${balance}`);
            
            // Check that Rewarded event emitted
            console.log(`event: ${event}`);

            // Check that AuraNFT AP accrued
            // TODO - depends on updated AuraNFT

        } else {
            console.log('Swap failed');        
        }
    }
    */
}

/*
 * @dev Perform a withdrawl.
 */
async function withdraw() {
    // Get args: v, r, s
    /*
    const tx = {
        to: Address.SwapFee,
        value: ethers.utils.parseEther('0'),
        gasLimit: 6721975,
        maxPriorityFeePerGas: ethers.utils.parseUnits('5', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('20', 'gwei'),
        nonce: await wallet.getTransactionCount(),
        type: 2,
    };

    const walletTx = await wallet.sendTransaction(tx);
    console.log("WALLET TX", walletTx);
    */

    const v = 1;
    const r = '0x50ac64934255ccc57dd63f965cc503861e725840c8e5abea231debb886f7660b';
    const s = '0x767070b3011a9b91690e9d1f23b30ff6ba37cc574e772a05e453d5bc3b7824e5';

    // Set msg.sender == default
    overrides.from = Address.Default;

    // Call withdraw()
    const result = await swapFee.withdraw(v, r, s, overrides);
    console.log("RESULT", result);

    // Check that balance[account1] == 0

    // Check that totalMined increased

    // Check that msg.sender account increased

    // Check that Withdraw event emitted

    // Check that returns true
}

async function accrueAPFromMarket(account, tokenIn, quantityIn) {
    swapFee = ISwapFee.attach(Address.SwapFee).connect(market);

    // If necessary, set the market.
    let marketAddress = await swapFee.market();
    if (marketAddress == ethers.constants.AddressZero) {
        if (verbose) {
            console.log('Market address was zero.');
        }
        await setMarket(swapFee, market.getAddress());
    }

    let prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber();

    // Call the fuction.
    // Fails with "unknown account" 
    tx = await swapFee.accrueAPFromMarket(account, tokenIn, quantityIn, { gasLimit: overrides.gasLimit });
    await tx.wait();

    // Check whether the accrued AP increased.
    let accruedAP = await swapFee.totalAccruedAP();
    
    if (verbose) {
        console.log(`Total accrued AP is: ${accruedAP}`);
    }
}

async function setMarket(_contract, address) {
    if (verbose) {
        console.log(`Setting market address to ${short(address)}`);
    }
    tx = await _contract.setMarket(address);
    await tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
