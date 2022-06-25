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
 const helixNFTAddress = contracts.helixNFT[env.network];
 const helixToken = contracts.helixToken[env.network];
 
 async function main() {
     const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
     const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
     
     const IHelixToken = await ethers.getContractFactory("HelixToken");
     const helix = IHelixToken.attach(helixToken).connect(admin);
 
     const IHelixNFT = await ethers.getContractFactory("HelixNFT");
     const helixNFT = IHelixNFT.attach(helixNFTAddress).connect(admin);
 
     const IHelixChefNFT = await ethers.getContractFactory("HelixChefNFT");
     const chefNFT = IHelixChefNFT.attach(helixChefNFTAddress).connect(admin);
 
    //  console.log("TotalStaked:", (await chefNFT.totalStakedNfts()).toString());
    //  console.log("User staked:", (await chefNFT.users('0xCC8b0d940F3C450593b06e92e74C96b7908765f1')));
    // console.log("usersStakedNfts:", (await chefNFT.usersStakedNfts('0xCC8b0d940F3C450593b06e92e74C96b7908765f1')).toString());
    console.log("token ids:", (await helixNFT.getTokenIdsOfOwner('0xCC8b0d940F3C450593b06e92e74C96b7908765f1')))
    console.log("token info of id: 9", (await helixNFT.getToken('9')))
    console.log("token info of id: 12", (await helixNFT.getToken('12')))
    
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.log(error);
         process.exit(1);
     });