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
 
 const StakingTokenAddress = '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7'; // <- update me | token A which must be staked in this pool
 const RewardTokenAddress = '0xC5e5A2ca4A41aF3B01289c2071E35346c7f7C89E'; // <- update me
 const StartBlock = 1; // <- update me | block when users can deposit their money into this pool and get rewards
 const EndBlock = 1000000000; // <- update me | block when rewards are no longer being given away
 const RewardPerBlock = '1000000000000000000'; // <- update me | currently this value means 1 AURA per block
 
 async function main() {
 
     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);
     
     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

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
 