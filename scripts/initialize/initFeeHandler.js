/**
 * @dev Run to set collector fee
 * 
 *      npx hardhat run scripts/initialize/initFeeHandler.js --network rinkeby
 */

 const { ethers } = require("hardhat")
 const contracts = require("../constants/contracts")
 const initials = require("../constants/initials")
 const env = require("../constants/env")
 
 const referralRegisterAddress = contracts.referralRegister[env.network]
//  const yieldSwapAddress = contracts.yieldSwap[env.network]
 const vaultAddress = contracts.helixVault[env.network]
 const feeHandlerAddress = contracts.feeHandler[env.network]
 
 const referralRegisterCollectorPercent = initials.REFERRAL_COLLECTOR_PERCENT[env.network]
//  const yieldSwapCollectorPercent = initials.YIELD_SWAP_COLLECTOR_PERCENT[env.network]
 const vaultCollectorPercent = initials.HELIX_VAULT_COLLECTOR_PERCENT[env.network]
 const nftChefPercent = initials.FEEHANDLER_NFTCHEF_PERCENT[env.network]
 
 async function main() {
     const [deployer] = await ethers.getSigners()
     console.log(`Setter address: ${deployer.address}`)
     
     const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
     const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
 
     const referralRegisterName = "ReferralRegister"
     const referralRegister = await getContract(referralRegisterName, referralRegisterAddress, admin)
     await setCollectorPercent(
         referralRegisterName, 
         referralRegister, 
         referralRegisterCollectorPercent
     )
 
    //  const yieldSwapName = "YieldSwap"
    //  const yieldSwap = await getContract(yieldSwapName, yieldSwapAddress, admin)
    //  await setCollectorPercent(
    //      yieldSwapName, 
    //      yieldSwap, 
    //      yieldSwapCollectorPercent
    //  )
 
     const vaultName = "HelixVault"
     const vault = await getContract(vaultName, vaultAddress, admin)
     await setCollectorPercent(
         vaultName, 
         vault, 
         vaultCollectorPercent
     )
 
     const feeHandlerName = "FeeHandler"
     const feeHandler = await getContract(feeHandlerName, feeHandlerAddress, admin)
     console.log(`Set FeeHandler nftChefPercent to ${nftChefPercent}`)
     await feeHandler.setNftChefPercent(nftChefPercent)
 }    
 
 async function getContract(name, address, admin) {
     console.log(`Get contract ${name} from address ${address}`)
     const contractFactory = await ethers.getContractFactory(name)
     const contract = contractFactory.attach(address).connect(admin);
     return contract
 }
 
 async function setCollectorPercent(name, contract, percent) {
     console.log(`Set contract ${name} collector percent to ${percent}`)
     await contract.setCollectorPercent(percent)
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error)
         process.exit(1)
     })
 