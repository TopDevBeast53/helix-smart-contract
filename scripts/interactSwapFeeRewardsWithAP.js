/* 
 * @dev Interaction script for deployed Swap Fee Rewards with AP contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactSwapFeeRewardsWithAP.js --network testnetBSC
 */

/*
 * Convenience object. Stores the address of the account or contract.
 */
const Address = {
    Default: '0xfD9b80d3eC59fE49fe160E46dE93E0975b595292',
    SwapFee: '0xBDAC56d43C7Cf9f0d64425c773cD7dAbeEED0Ca5',    // Deployed
    Factory: '0xe1cf8d44bb47b8915a70ea494254164f19b7080d',    // Deployed
    Router: '0x38433227c7a606ebb9ccb0acfcd7504224659b74',     // Deployed
    Market: '0xB69888c53b9c4b779E1bEAd3A5019a388Bc072e9',     // Fake
    Auction: '0xdCe96794ba50b147C60F35D614e76451062fBce7',    // Fake
}

// Load the provider and signer.
const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const provider = new ethers.providers.getDefaultProvider(rpc);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Create the swapFee instance.
const swapFeeJson = require('../build/contracts/SwapFeeRewardsWithAP.json');
const swapFeeAbi = swapFeeJson.abi;
const swapFee = new ethers.Contract(Address.SwapFee, swapFeeAbi, wallet);

/*
 * @dev Initialize the contract and call functions.
 */
async function main() {
    await sampleTx();
};

/*
 * @dev Simple sample transactions to verify that the things are working.
 *      Intended to be removed when other transactions are working reliably.
 */
async function sampleTx() {
    const pairsLength = await swapFee.getPairsListLength();
    console.log("PAIRS LENGTH\n", pairsLength);

    const tokenA = '0xD4ae13353581139e897758a2CaE7dd5068AA138d';
    const tokenB = '0x1B6Bdc9a7a34a2Ae3aB0b1618BB893b59fd7FaA2';
    const pairExists = await swapFee.pairExists(tokenA, tokenB);
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
