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
 *         - Set `AuraToken` address to `auraToken` of `AuraChefNFT`.
 */
 const { ethers, network } = require(`hardhat`);
 const contracts = require("./constants/contracts")
 const env = require("./constants/env")
 
 async function main() {
 
     const [deployer] = await ethers.getSigners();
     console.log(`Deployer address: ${ deployer.address}`);
     
     let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
     
     console.log(`------ Start deploying Voting contract ---------`);
     const Voting = await ethers.getContractFactory(`Voting`);
     const _voting = await Voting.deploy(contracts.auraToken[env.network], {nonce: nonce});
     await _voting.deployTransaction.wait();
     console.log(`Voting deployed to ${_voting.address}`);
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     });
 