/**
 * @dev Smart Chef Deployment
 * 
 * A new Smart Chef must be deployed every time we want to create a pool for a certain pair
 * of (staking token, reward token) or duration / reward per block, etc.
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/deploySmartChef.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `SmartChef` contract.
 *      2. Add `SmartChef` as minter to `AuraToken`
 */
 const { ethers, network } = require(`hardhat`);
 
 const env = 'test';
 
 const StakingTokenAddress = '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135'; // <- update me
 const RewardTokenAddress = '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135'; // <- update me
 const StartBlock = 0; // <- update me
 const EndBlock = 1000000000; // <- update me
 const RewardPerBlock = '10000000000000000'; // <- update me
 
 async function main() {
 
     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);
     
     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
     
     if (DevPercent + StakingPercent != 1000000) {
         console.log('DevPercent + StakingPercent != 1000000');
         return;
     }

     console.log(`------ Start deploying Smart Chef contract ---------`);
     const SmartChef = await ethers.getContractFactory(`SmartChef`);
     chef = await SmartChef.deploy(
        /*STAKING token address=*/StakingTokenAddress,
        /*REWARD token address=*/RewardTokenAddress,
        /*reward amount per block=*/RewardPerBlock,
        /*start block=*/StartBlock,
        /*end block=*/EndBlock, {nonce: nonce});
     await chef.deployTransaction.wait();
     console.log(`Smart Chef deployed to ${chef.address}`);

     console.log(`Do NOT forget to fund the newly deployed chef with some reward tokens!`);
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     });
 