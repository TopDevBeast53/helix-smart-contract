/**
 * @dev Verification for NFT Staking Contract deployed
 *
 * command for verify on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/verifyContracts.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Verify `AuraNFT` contract.
 *      2. Verify `AuraChefNFT` contract.
 *      3. Verify `SwapFeeRewardsWithAP` contract.
 */

const hre = require('hardhat');
const {BigNumber} = require("ethers");
const contracts = require("./constants/contracts")
const env = require("./constants/env")

async function main() {

    console.log(`Verify AuraNFT contract`);
    let res = await hre.run("verify:verify", {
        address: contracts.auraNFTImpl[env.network],
        constructorArguments: []
    })
    console.log(res);
    
    console.log(`Verify contract AuraChefNFT`);
    res = await hre.run("verify:verify", {
        address: contracts.auraNFTChef[env.network],
        constructorArguments: [contracts.auraNFT[env.network], 0]
    })
    console.log(res);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
