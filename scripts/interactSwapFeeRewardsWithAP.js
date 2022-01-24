/* 
 * @dev Interaction script for deployed Swap Fee Rewards with AP contract.
 * 
 * Run from project root using:
 *     truffle exec scripts/interactSwapFeeRewardsWithAP.js --network bsc_testnet 
 */

// Load the provider.
const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const provider = new ethers.providers.getDefaultProvider(rpc);

// Load the contract details.
const contract = require('../build/contracts/SwapFeeRewardsWithAP.json');
const contractAbi = contract.abi;
const contractAddress = '0xBDAC56d43C7Cf9f0d64425c773cD7dAbeEED0Ca5';

// Create the contract instance.
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const instance = new ethers.Contract(contractAddress, contractAbi, wallet);

/*
 * @dev Initialize the contract and call functions.
 */
async function main() {
    await sampleTx();
};

/*
 * Convenience object for getting the address associated with a given account.
 * Useful for setting msg.sender = account
 */
/*
const Addresses {
    'default': [defaultAddress],
    'factory': [factoryAddress],
    'router': [routerAddress],
    'market': [marketAddress],
    'auction': [auctionAddress],
}
*/

/*
 * @dev Simple sample transactions to verify that the things are working.
 *      Intended to be removed when other transactions are working reliably.
 */
async function sampleTx() {
    const pairsLength = await instance.getPairsListLength();
    console.log("PAIRS LENGTH\n", pairsLength);

    const tokenA = '0xD4ae13353581139e897758a2CaE7dd5068AA138d';
    const tokenB = '0x1B6Bdc9a7a34a2Ae3aB0b1618BB893b59fd7FaA2';
    const pairExists = await instance.functions.pairExists(tokenA, tokenB);
    console.log("PAIR EXISTS\n", pairExists);
}

/* 
 * @dev Perform a token swap.
 */
async function swap() {
    // Define args: account, input, output, amount

    // Whitelist tokens with whitelistAdd()
    
    // Add the token pair with addPair()

    // Set msg.sender == router

    // Call swap()

    // Check that balance[account] increased
    
    // Check that Rewarded event emitted

    // Check that AuraNFT AP accrued

    // Check that returns true
}

/*
 * @dev Accrue AP from Market
 */
async function accrueAPFromMarket() {
    // Set msg.sender == market
        
    // Call accrueAPFromMarket()

    // Check that totalAccruedAP increased

    // Check that AuraNFT accrued AP
}

/*
 * @dev Accrue AP from Auction
 */
async function accrueAPFromAuction() {
    // Set msg.sender == auction 
        
    // Call accrueAPFromAuction()

    // Check that totalAccruedAP increased

    // Check that AuraNFT accrued AP
}

/*
 * @dev Perform a withdrawl.
 */
async function withdraw() {
    // Get args: v, r, s

    // Set msg.sender == default

    // Call withdraw()

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
