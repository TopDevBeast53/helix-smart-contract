/* 
 * @dev Interaction script for deployed Swap Fee Rewards with AP contract.
 * 
 * Run from project root using:
 *     truffle exec scripts/interactSwapFeeRewardsWithAP.js --network bsc_testnet 
 */

async function main() {
    const Web3 = require('web3');
    const web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545'));
    
    let abi = require('../build/contracts/SwapFeeRewardsWithAP.json').abi;
    let address = '0x3427F78a570605003531547fC444ce4f521ac5B3';
    let swapFeeRewardsWithAP = new web3.eth.Contract(abi, address);

    // Expect the following to return 0.
    console.log("Get pairs list length: ", await swapFeeRewardsWithAP.methods.getPairsListLength().call());
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
