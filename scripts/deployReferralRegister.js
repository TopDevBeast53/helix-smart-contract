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

 const AuraToken = ''; // <-- update me
 const StakingFeePercent = 30;
 const SwapFeePercent = 50;

 async function main() {

     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);

     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

     console.log(`------ Start deploying Referral Register contract ---------`);
     const ReferralRegister = await ethers.getContractFactory(`ReferralRegister`);
     ref = await ReferralRegister.deploy(
         /*aura=*/AuraToken,
        /*staking percent=*/StakingFeePercent,
        /*swap percent*/SwapFeePercent);
     await ref.deployTransaction.wait();
     console.log(`Referral Register deployed to ${ref.address}`);

 }

 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     }); 