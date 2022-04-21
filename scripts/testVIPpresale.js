/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/testVIPpresale.js --network testnetBSC
 */

 const { ethers, network } = require(`hardhat`);
 const contracts = require("./constants/contracts")
 const env = require("./constants/env");
const initials = require("./constants/initials");
 require("dotenv").config();
 
 const vipPresale = contracts.vipPresale[env.network];
 const inputToken = initials.VIP_PRESALE_INPUT_TOKEN[env.network];
 const outputToken = initials.VIP_PRESALE_OUTPUT_TOKEN[env.network];
 
 async function main() {
     const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
     const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);

    //  const IInputToken = await ethers.getContractFactory('TestToken')
    //  const InputToken = IInputToken.attach(inputToken).connect(admin);
     
    //  console.log(`Approving now...`)
    //  const tx = await InputToken.approve(vipPresale, '100000000000000000000000000')
    //  await tx.wait()
    //  console.log(`\n`)
 
     const IVipPresale = await ethers.getContractFactory('VipPresale')
     const VipPresale = IVipPresale.attach(vipPresale).connect(admin);
     console.log(`Add WhiteList...`)
     // 0x59201fb8cb2D61118B280c8542127331DD141654
     // 0x5e3A0B1aaccd48E92D6BB9886F9C5159c773f9B2
     // 0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57
     const txx = await VipPresale.whitelistAdd(
         ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'
         , '0x5e3A0B1aaccd48E92D6BB9886F9C5159c773f9B2'
         , '0x59201fb8cb2D61118B280c8542127331DD141654']
         , [30, 50, 100])
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