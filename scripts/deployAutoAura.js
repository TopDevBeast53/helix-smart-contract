/**
 * @dev AutoAura Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/deployAutoAura.js --network testnetBSC`
 * 
 * Prereqs:
 *      1. Deploy `MasterChef` contract (if not deployed).      
 * 
 * Workflow:
 *      2. Update variables with according addresses.
 *      3. Deploy the AutoAura contract.
 */
 const { ethers, network } = require(`hardhat`);
 
 const env = 'test';
 
 const AuraTokenAddress = '0xC5e5A2ca4A41aF3B01289c2071E35346c7f7C89E';  // <- update me | Aura token address
 const DeveloperAddress = '0x38606aEE8c5E713f91688D41ad6a7ab3B923F34b'; // <- update me | who is the admin taking care of calling all admin functions
 const TreasuryAddress = '0x7167a81a3a158Fc0383124Bd7e4d4e43f2b728b8'; // <- update me | who will collect the fees
 const MasterChefAddress = '0x3c72E6b19FAC06D07ee90dd7AFe9c655E798B5Ab'; // <- update me | address of deployed master chef
 
 async function main() {
 
     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);
     
     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

     console.log(`------ Start deploying AutoAura contract ---------`);
     const AutoAura = await ethers.getContractFactory(`AutoAura`);
     let auto = await AutoAura.deploy(
        /*aura token address=*/AuraTokenAddress,
        /*master chef address=*/MasterChefAddress,
        /*admin address=*/DeveloperAddress,
        /*treasury address=*/TreasuryAddress, {nonce: nonce});
     await auto.deployTransaction.wait();
     console.log(`AutoAura deployed to ${auto.address}`);
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     });
 