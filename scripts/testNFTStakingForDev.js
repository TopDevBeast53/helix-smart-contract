/**
 * @dev Deployment for test of NFT Staking  
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/testNFTStakingForDev.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Mint 10 AuraNFT by minter
 *      2. Transfer tokenId 1~5 to UserA()
 *      
 */
 const { ethers, network } = require(`hardhat`);
 const {BigNumber} = require("ethers");
 