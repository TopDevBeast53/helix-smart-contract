/**
 * @dev Master Chef Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/5_deployMasterChef.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `MasterChef` contract.
 *      2. Add `MasterChef` as minter to `AuraToken`
 */
 const { ethers, network } = require(`hardhat`);
 const contracts = require("./constants/contracts")
 const env = require("./constants/env")
 
 const AuraTokenAddress = contracts.auraToken[env.network];
 const DeveloperAddress = '0x7167a81a3a158Fc0383124Bd7e4d4e43f2b728b8'; // <- update me
 const StartBlock = 0;
 const AuraTokenRewardPerBlock = '40000000000000000000'; // 40 * 10e18 -> 40 aura tokens per block 
 const ReferralRegister = '0xC8AeFE4648E709e8326045Ca1896295f6057F38C'; // <- update me
 const StakingPercent = 999000; // -> 99.9% of all farm rewards will go the users
 const DevPercent = 1000; // -> 0.1% of all farm rewards will go to dev address
 
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
        /*dev percent=*/DevPercent,
        /*ref=*/ ReferralRegister, 
        {nonce: nonce});
     await chef.deployTransaction.wait();
     console.log(`Master Chef deployed to ${chef.address}`);
 
     console.log(`------ Add MasterChef as Minter to AuraToken ---------`);
     const AuraToken = await ethers.getContractFactory(`AuraToken`);
     const auraToken = AuraToken.attach(AuraTokenAddress);

     let tx = await auraToken.addMinter(chef.address, {nonce: ++nonce, gasLimit: 3000000});
    //  console.log(tx);
     await tx.wait();
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     });
 