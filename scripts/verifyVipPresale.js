/**
 * @dev Verify the deplyed VIP Presale contract
 *
 * command for verify on bsc-testnet: 
 * 
 *      npx hardhat run scripts/verifyVipPresale.js --network testnetBSC
 */

const hre = require('hardhat');
const env = require('./constants/env')

const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// deployed contract address
const vipPresale = contracts.vipPresale[env.network]

// contract constructor arguments                                           // main  / test
const inputTokenAddress = initials.VIP_PRESALE_INPUT_TOKEN[env.network]     // BUSD  / TestTokenA
const outputTokenAddress = initials.VIP_PRESALE_OUTPUT_TOKEN[env.network]   // HELIX / TestTokenB
const treasuryAddress = initials.VIP_PRESALE_TREASURY[env.network]
const inputRate = initials.VIP_PRESALE_INPUT_RATE[env.network]
const outputRate = initials.VIP_PRESALE_OUTPUT_RATE[env.network]
const purchasePhaseDuration = initials.VIP_PRESALE_PURCHASE_PHASE_DURATION[env.network]
const withdrawPhaseDuration = initials.VIP_PRESALE_WITHDRAW_PHASE_DURATION[env.network]

async function main() {
    console.log(`Verify VIP Presale contract`);
    let res = await hre.run("verify:verify", {
        address: vipPresale,
        constructorArguments: 
            [
                inputTokenAddress,
                outputTokenAddress,
                treasuryAddress,
                inputRate,
                outputRate,
                purchasePhaseDuration,
                withdrawPhaseDuration
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
