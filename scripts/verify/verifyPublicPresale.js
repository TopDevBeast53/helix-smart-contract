/**
 * @dev Verify the deplyed Public Presale contract
 *
 * command for verify on bsc-testnet: 
 * 
 *      npx hardhat run scripts/verify/verifyPublicPresale.js --network rinkeby
 */

const hre = require('hardhat');
const env = require('../constants/env')

const contracts = require('../constants/contracts')
const initials = require('../constants/initials')

// deployed contract address
const publicPresale = contracts.publicSale[env.network]

// contract constructor arguments                                           // main  / test
const inputTokenAddress = initials.PUBLIC_PRESALE_INPUT_TOKEN[env.network]     // BUSD  / TestTokenA
const outputTokenAddress = initials.PUBLIC_PRESALE_OUTPUT_TOKEN[env.network]   // HELIX / TestTokenB
const treasuryAddress = initials.PUBLIC_PRESALE_TREASURY[env.network]
const inputRate = initials.PUBLIC_PRESALE_INPUT_RATE[env.network]
const outputRate = initials.PUBLIC_PRESALE_OUTPUT_RATE[env.network]
const purchasePhaseDuration = initials.PUBLIC_PRESALE_PURCHASE_PHASE_DURATION[env.network]

async function main() {
    console.log(`Verify Public Presale contract`);
    let res = await hre.run("verify:verify", {
        address: publicPresale,
        constructorArguments: 
            [
                inputTokenAddress,
                outputTokenAddress,
                treasuryAddress,
                inputRate,
                outputRate,
                purchasePhaseDuration
            ]
    })
    console.log('done');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
