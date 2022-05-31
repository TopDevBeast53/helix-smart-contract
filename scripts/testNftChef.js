/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/testNftChef.js --network rinkeby
 */

 const { ethers, network } = require(`hardhat`);
 const contracts = require("./constants/contracts")
 const env = require("./constants/env")
 require("dotenv").config();
 
 
 const helixChefNFTAddress = contracts.helixChefNFT[env.network];
 const helixToken = contracts.helixToken[env.network];
 
 async function main() {
     const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
     const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
     
     const IHelixToken = await ethers.getContractFactory("HelixToken");
     const helix = IHelixToken.attach(helixToken).connect(admin);
 
     const IHelixChefNFT = await ethers.getContractFactory("HelixChefNFT");
     const chefNFT = IHelixChefNFT.attach(helixChefNFTAddress).connect(admin);
 
     console.log("TotalStaked:", (await chefNFT.totalStakedNfts()).toString());
    //  console.log("User staked:", (await chefNFT.users('0x59201fb8cb2D61118B280c8542127331DD141654')));
    console.log("usersStakedNfts:", (await chefNFT.usersStakedNfts('0x59201fb8cb2D61118B280c8542127331DD141654')).toString());
     console.log("getAccruedReward:", (await chefNFT.getAccruedReward('0x59201fb8cb2D61118B280c8542127331DD141654', 1000)))
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.log(error);
         process.exit(1);
     });