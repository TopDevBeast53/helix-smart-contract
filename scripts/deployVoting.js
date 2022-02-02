/**
 * @dev Voting Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/deployVoting.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `Voting` contract.
 *      2. Deploy `AuraChefNFT` contract.
 *         - Set `AuraNFT` address deployed to `IAuraNFT` of `AuraChefNFT`.
 *         - Set `AuraChefNFT` contract to staker of `AuraNFT`.
 *         - Set `deployer` to minter of `AuraNFT`, Owner(deployer) can add another man later.
 *         - Add RewardToken of `AuraChefNFT` with WBNB
 */
 const { ethers, network } = require(`hardhat`);
 
 const env = 'test';
 
 const AURA = {
     'test': '0xdf2b1082ee98b48b5933378c8f58ce2f5aaff135',
 }
 
 async function main() {
 
     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);
     
     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
     
     console.log(`------ Start deploying Voting contract ---------`);
     const Voting = await ethers.getContractFactory(`Voting`);
     const _voting = await Voting.deploy(AURA[env], {nonce: nonce});
     await _voting.deployTransaction.wait();
     console.log(`Voting deployed to ${_voting.address}`);
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     });
 