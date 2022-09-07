/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/testNftChef.js --network rinkeby
 */

 const { ethers, network } = require(`hardhat`);
 const { getChainId, getRpcUrl } = require("../shared/utilities")
 const contracts = require("./constants/contracts")
 require("dotenv").config();
 
 
async function main() {
    const chainId = await getChainId()
    const helixChefNFTAddress = contracts.helixChefNFT[chainId];
    const helixNFTAddress = contracts.helixNFT[chainId];
    const helixToken = contracts.helixToken[chainId];
 
    const rpcUrl = getRpcUrl()
     const rpc =  new ethers.providers.JsonRpcProvider(rpcUrl) ;
     const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
     
     const IHelixToken = await ethers.getContractFactory("HelixToken");
     const helix = IHelixToken.attach(helixToken).connect(admin);
 
     const IHelixNFT = await ethers.getContractFactory("HelixNFT");
     const helixNFT = IHelixNFT.attach(helixNFTAddress).connect(admin);
 
     const IHelixChefNFT = await ethers.getContractFactory("HelixChefNFT");
     const chefNFT = IHelixChefNFT.attach(helixChefNFTAddress).connect(admin);
 
    //  console.log("User staked:", (await chefNFT.users('0xCC8b0d940F3C450593b06e92e74C96b7908765f1')));
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
