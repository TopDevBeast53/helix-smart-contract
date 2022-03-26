/**
 * @dev Deployment for test of NFT Staking  
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/testMasterChef.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Initialize to set wallet & contract instance
 *      2. Check how many `HELIX` tokens `HelixChefNFT` contract has
 *      3. Mint to an user by minter
 *      4. Stake by the user
 *      5. Accrue HelixPoints to the user by accruer(TODO: accruer should be SwapFeeRewardsWithAP but now minter temporary)
 *      6. Boost NFT by the user
 */


 const { ethers, network } = require(`hardhat`);
 const {BigNumber} = require("ethers");
 const contracts = require("./constants/contracts")
 const env = require("./constants/env")
  
 require("dotenv").config();
 
 let IMasterChef;
 let rpc, minter, user;
 let tx, nonce_minter, nonce_user;
 
 function expandTo18Decimals(n) {
     return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
 }
 
 async function init() {
     rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
     minter = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
     user = new ethers.Wallet( process.env.USER_PRIVATE_KEY, rpc);
     IMasterChef = await ethers.getContractFactory("MasterChef");
     console.log('-- initialize to set connections --');
     console.log('minter address:', minter.address);
     console.log('user address:', user.address);
 }
 
 async function getPendingReward(){
     console.log('sdfsf')
     const masterChef = IMasterChef.attach(contracts.masterChef[env.network]).connect(user);
     let ret = await masterChef.pendingHelixToken(2, user.address);
     console.log(ret)
     return ret;
 }
 
 
 
 async function main() {
 
     //initialize to set wallet & contract instance
     await init();
 
     //get nonce of minter
     nonce_minter = await network.provider.send(`eth_getTransactionCount`, [minter.address, "latest"]);
 
     await getPendingReward()
 
     console.log('Done!')
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.log(error);
         process.exit(1);
     });