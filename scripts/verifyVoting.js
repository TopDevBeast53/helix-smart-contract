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
const contracts = require("./constants/contracts")
const env = require("./constants/env")

async function main() {

    console.log(`Verify Voting contract`);
    let res = await hre.run("verify:verify", {
        address: contracts.voting[env.network],
        constructorArguments: [contracts.auraToken[env.network]]
    })
    console.log(res);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
