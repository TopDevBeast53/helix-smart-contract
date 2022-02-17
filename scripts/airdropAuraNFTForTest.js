/**
 * @dev Airdrop AuraNFT for test of NFT Staking  
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/airdropAuraNFTForTest.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Initialize to set wallet & contract instance
 *      2. Mint to an user by minter
 */


 const { ethers, network } = require(`hardhat`);
 const {BigNumber} = require("ethers");
 const contracts = require("./constants/contracts")
 const env = require("./constants/env")
  
 require("dotenv").config();
 
 let IAuraNFT;
 let rpc, minter, user;
 let tx, nonce_minter;
 
 function expandTo18Decimals(n) {
     return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
 }
 
 async function init() {
     rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
     minter = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
     user = new ethers.Wallet( process.env.USER_PRIVATE_KEY, rpc);
     IAuraNFT = await ethers.getContractFactory("AuraNFT");
     console.log('-- initialize to set connections --');
     console.log('minter address:', minter.address);
     console.log('user address:', user.address);
 }
 
 async function mintToUserByMinter() {
     console.log('-- Now minting --');
 
     const AuraNFT = IAuraNFT.attach(contracts.auraNFT[env.network]).connect(minter);
 
     tx = await AuraNFT.mint(user.address, {nonce: nonce_minter, gasLimit: 3000000});//
     await tx.wait();
 
     tx = await AuraNFT.getTokenIdsOfOwner(user.address);
     console.log('-- Successful to mint to user --');
     console.log('tokenids:', tx);
 }
 
 async function main() {
 
     //initialize to set wallet & contract instance
     await init();
 
     //get nonce of minter
     nonce_minter = await network.provider.send(`eth_getTransactionCount`, [minter.address, "latest"]);
 
     //mint by minter
     await mintToUserByMinter();
 
     console.log('Done!')
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.log(error);
         process.exit(1);
     });