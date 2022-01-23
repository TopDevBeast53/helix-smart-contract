/**
 * @dev Master Chef Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/deployMasterChef.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `MasterChef` contract.
 *      2. Add `MasterChef` as minter to `AuraToken`
 */
 const { ethers, network } = require(`hardhat`);
 
 const env = 'test';
 
 const AuraTokenAddress = '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135';
 const DeveloperAddress = '0x59201fb8cb2D61118B280c8542127331DD141654';
 const StartBlock = 0;
 const AuraTokenRewardPerBlock = '10000000000000000'; 
 const StakingPercent = 999995;
 const DevPercent = 5;
 
 async function main() {
 
     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);
     
     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
     
     if (DevPercent + StakingPercent != 1000000) {
         console.log('DevPercent + StakingPercent != 1000000');
         return;
     }

     console.log(`------ Start deploying Master Chef contract ---------`);
     const MasterChef = await ethers.getContractFactory(`MasterChef`);
     chef = await MasterChef.deploy(
        /*aura token address=*/AuraTokenAddress,
        /*dev address=*/DeveloperAddress,
        /*aura token per block=*/AuraTokenRewardPerBlock,
        /*start block=*/StartBlock,
        /*staking percent=*/StakingPercent,
        /*dev percent=*/DevPercent, {nonce: nonce});
     await chef.deployTransaction.wait();
     console.log(`Master Chef deployed to ${chef.address}`);
 
     console.log(`------ Add MasterChef as Minter to AuraToken ---------`);
     const AuraToken = await ethers.getContractFactory(`AuraToken`);
     const auraToken = AuraToken.attach(AuraTokenAddress);

     let tx = await auraToken.addMinter(chef.address, {nonce: ++nonce, gasLimit: 3000000});
     console.log(tx);
     await tx.wait();
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     });
 