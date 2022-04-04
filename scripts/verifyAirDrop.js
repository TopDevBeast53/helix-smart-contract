/**
 * @dev Verify the deplyed AirDrop contract
 *
 * command for verify on bsc-testnet: 
 * 
 *      npx hardhat run scripts/verifyAirDrop.js --network testnetBSC
 */

const hre = require('hardhat');
const env = require('./constants/env')

const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// deployed contract address
const airDrop = contracts.airDrop[env.network]

// contract constructor arguments                                           // main  / test
const tokenAddress = initials.AIRDROP_TOKEN[env.network]             // HELIX / TestTokenB
const name = initials.AIRDROP_NAME[env.network]
const withdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[env.network]

async function main() {
    console.log(`Verify AirDrop contract`);
    let res = await hre.run("verify:verify", {
        address: airDrop,
        constructorArguments: 
            [
                name,
                tokenAddress,
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
