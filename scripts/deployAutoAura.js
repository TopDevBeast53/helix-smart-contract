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
 
 const AuraTokenAddress = '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135';
 const DeveloperAddress = '0x59201fb8cb2D61118B280c8542127331DD141654';
 const TreasuryAddress = '0x59201fb8cb2D61118B280c8542127331DD141654';
 const MasterChefAddress = ''; // <- update me
 
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
 