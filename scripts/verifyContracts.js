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

function expandTo18Decimals(n) {
    return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
}

const AuraNFTAddress = `0xBa464cb9f2ff62f41288aF179F6C6F3290D4db43`;
const AuraChefNFTAddress = '0x27534C9242B048496d9F654B2B57FB6a70e053e8';

const initialAuraPoints = expandTo18Decimals(1); // AuraNFT's _initialAuraPoints
const levelUpPercent = 10; // AuraNFT's _levelUpPercent

async function main() {

    console.log(`Verify AuraNFT contract`);
    let res = await hre.run("verify:verify", {
        address: AuraNFTAddress,
        constructorArguments: ["", initialAuraPoints, levelUpPercent]
    })
    console.log(res);
    
    console.log(`Verify contract AuraChefNFT`);
    res = await hre.run("verify:verify", {
        address: AuraChefNFTAddress,
        constructorArguments: [AuraNFTAddress, 0]
    })
    console.log(res);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
