/**
 * @dev Verification for Voting Contract deployed
 *
 * command for verify on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/verifyVoting.js --network testnetBSC`
 *       
 * Workflow:
 *      1. Verify `Voting` contract.
 */

const hre = require('hardhat');

const env = 'test';

const AURA = {
    'test': '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135',
}

const VOTING = {
    'test': '0xC3A5dc2D9eC0e8CC6603F81FDc0Fd7aB53E389b3',
}
async function main() {

    console.log(`Verify Voting contract`);
    let res = await hre.run("verify:verify", {
        address: VOTING[env],
        constructorArguments: [AURA[env]]
    })
    console.log(res);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
