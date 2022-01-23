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
    const Web3 = require('web3');
    const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
    
    let abi = require('../build/contracts/SwapFeeRewardsWithAP.json').abi;
    let address = '0xe64670DDd83e50b99103db2Bc2d6Fda83a06AE6f'
    contract = new web3.eth.Contract(abi, address);
    // console.log("CONTRACT:", await contract);
    
    swap();
};

/*
/*
 * Convenience object for getting the address associated with a given account.
 * Useful for setting msg.sender = account
 */
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
