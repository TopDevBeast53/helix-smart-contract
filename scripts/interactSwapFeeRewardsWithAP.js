/* 
 * @dev Interaction script for deployed Swap Fee Rewards with AP contract.
 * 
 * Run from project root using:
 *     truffle exec scripts/interactSwapFeeRewardsWithAP.js --network bsc_testnet 
 */

let contract;

/*
 * @dev Initialize the contract and call functions.
 */
async function main() {
    const ethers = require('ethers');
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
    const provider = new ethers.providers.getDefaultProvider(rpc);
    const contract = require('../build/contracts/SwapFeeRewardsWithAP.json');
    const abi = contract.abi;
    const address = '0xe64670DDd83e50b99103db2Bc2d6Fda83a06AE6f';

    console.log("ACCOUNT TRANSACTION COUNT\n", await provider.getTransactionCount('0x59201fb8cb2D61118B280c8542127331DD141654'));

    const wallet = new ethers.Wallet('a866afe778d830c8c08cbe45e18f4508871e4f6f0920db643f1cc5978da9dc75', provider);
    console.log("WALLET\n", wallet);

    const instance = new ethers.Contract(address, abi, wallet);
    console.log("INSTANCE\n", instance);
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
