/**
 * @dev Referral Register Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/deployReferralRegister.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `ReferralRegister` contract.
 */
 const { ethers, network } = require(`hardhat`);

 const env = 'test';

 const AuraTokenAddress = '0xC5e5A2ca4A41aF3B01289c2071E35346c7f7C89E'; // <-- update me
 const StakingFeePercent = 30;
 const SwapFeePercent = 50;

 async function main() {

     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);

     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

     console.log(`------ Start deploying Referral Register contract ---------`);
     const ReferralRegister = await ethers.getContractFactory(`ReferralRegister`);
     ref = await ReferralRegister.deploy(
         /*aura=*/AuraTokenAddress,
        /*staking percent=*/StakingFeePercent,
        /*swap percent*/SwapFeePercent);
     await ref.deployTransaction.wait();
     console.log(`Referral Register deployed to ${ref.address}`);

     console.log(`------ Add Referral Register as Minter to AuraToken ---------`);
     const AuraToken = await ethers.getContractFactory(`AuraToken`);
     const auraToken = AuraToken.attach(AuraTokenAddress);

     let tx = await auraToken.addMinter(ref.address, {nonce: ++nonce, gasLimit: 3000000});
     await tx.wait();
 }

 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     }); 