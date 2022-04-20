/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/testVIPpresale.js --network testnetBSC
 */

 const { ethers, network } = require(`hardhat`);
 const contracts = require("./constants/contracts")
 const env = require("./constants/env")
 require("dotenv").config();
 
 const vipPresale = contracts.vipPresale[env.network];
 const inputToken = "0xbe5d153b1a9e82e35d1e5f4da8805e088c344482";
//  const outputToken = "0xfa120708E905A870212B3DCd0079EC6084F5aC3E";
 
 async function main() {
     const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
     const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);

     const IInputToken = await ethers.getContractFactory('TestToken')
     const InputToken = IInputToken.attach(inputToken).connect(admin);
     
    //  console.log(`Approving now...`)
    //  const tx = await InputToken.approve(vipPresale, '100000000000000000000000000')
    //  await tx.wait()
    //  console.log(`\n`)
 
     const IVipPresale = await ethers.getContractFactory('VipPresale')
     const VipPresale = IVipPresale.attach(vipPresale).connect(admin);
     console.log(`Add WhiteList...`)
     const txx = await VipPresale.whitelistAdd(['0x5e3A0B1aaccd48E92D6BB9886F9C5159c773f9B2'], [10])
     await txx.wait()
     console.log(`\n`)

     console.log(`done`)
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.log(error);
         process.exit(1);
     });