/* 
 * @dev Interaction script for deployed Swap Fee Rewards with AP contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactSwapFeeRewardsWithAP.js --network testnetBSC
 */

const verbose = true;

/*
 * Convenience object. Stores the address of the account or contract.
 */
const Address = {
    Owner: '0x59201fb8cb2D61118B280c8542127331DD141654',
    Default: '0xfD9b80d3eC59fE49fe160E46dE93E0975b595292',
    SwapFee: '0x380D2a5Cc9E5e980EdeC79bD5bee9C7c0c8E50da',      // Deployed
    Factory: '0xe1cf8d44bb47b8915a70ea494254164f19b7080d',      // Deployed
    Router: '0x38433227c7a606ebb9ccb0acfcd7504224659b74',       // Deployed
    AuraToken: '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135',    // Deployed 
    BnbToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',     // Deployed
    AuraNFT: '0xA4bc4Cda3c72c9fEF8af239370BAA7f4Ba38826f',      // Deployed
    Market: '0xB69888c53b9c4b779E1bEAd3A5019a388Bc072e9',       // Fake
    Auction: '0xdCe96794ba50b147C60F35D614e76451062fBce7',      // Fake
}

// Load the provider and signer.
const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const provider = new ethers.providers.getDefaultProvider(rpc);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Create the swapFee instance.
const swapFeeJson = require('../build/contracts/SwapFeeRewardsWithAP.json');
const swapFeeAbi = swapFeeJson.abi;
const swapFee = new ethers.Contract(Address.SwapFee, swapFeeAbi, wallet);

// Enable changing the contract's caller.
const routerSigner = provider.getSigner(0);
const swapFeeAsRouter = swapFee.connect(routerSigner);

// Define the transaction parameters for the owner.
let overrides = {
    from: Address.Owner,
    gasLimit: 6721975,
};

/**
 * @dev Initialize the contract and call functions.
 */
async function main() {
    let tokenA = Address.AuraToken;
    let tokenB = Address.BnbToken;
    
    // Prepare the token pair for swapping.
    //await preparePair(tokenA, tokenB); 
   
    // Swap the tokens.
    let account = Address.Default;
    let amount = 100;
    await swap(account, tokenA, tokenB, amount);

    // Withdraw tokens.
    //await withdraw();
};

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
        console.log(`(${short(tokenA)}, ${short(tokenB)}) pair exists: ${pairExists}`);
    }
    return pairExists;
}

/**
 * @dev Adds the (tokenA, tokenB) swap pair.
 */
async function addPair(tokenA, tokenB, percentReward) {
    const pairAddress = await swapFee.pairFor(tokenA, tokenB)
    const addPairTx = await swapFee.addPair(percentReward, pairAddress, overrides);

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

    /*
    swapFeeAsRouter.swap(account, input, output, amount).then((tx) => {
        return tx.wait().then((receipt) => {
                console.log(`RECEIPT: ${receipt}`);
            }, (error) => {
                console.log(`ERROR: ${error}`);
            });
    });
    */

    const result = await swapFeeAsRouter.swap(account, input, output, amount);
    console.log("RESULT: ", result);
    
    /*
    // Set msg.sender == router
    overrides.from = Address.Router;

    // Call swap()
    const result = swapFee.swap(account, input, output, amount, overrides);

    let event;
    swapFee.on("Rewarded", (_event) => { event = _event; });
   
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

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
