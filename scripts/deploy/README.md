DEPLOY

The scripts in this directory deploy their respective contracts.
These scripts should be run in conjunction with those in ../initialize to ensure that each
contract is correctly configured.

For convenience, listed below are the commands to deploy each contract to the rinkeby network:  
Take care to update each contract's deployed address(es) in ../constants/contracts.js.

npx hardhat run scripts/deploy/0_deployHelixToken.js --network rinkeby  
npx hardhat run scripts/deploy/1_deployHelixNFT.js --network rinkeby  
npx hardhat run scripts/deploy/2_deployFeeMinter.js --network rinkeby  
npx hardhat run scripts/deploy/3_deployHelixNFTBridge.js --network rinkeby  
npx hardhat run scripts/deploy/4_deployHelixChefNFT.js --network rinkeby  
npx hardhat run scripts/deploy/5_deployFeeHandler.js --network rinkeby  
npx hardhat run scripts/deploy/6_deployReferralRegister.js --network rinkeby  
npx hardhat run scripts/deploy/7_deployHelixVault.js --network rinkeby  
npx hardhat run scripts/deploy/8_deployFactory.js --network rinkeby  
npx hardhat run scripts/deploy/9_deployOracleFactory.js --network rinkeby  
npx hardhat run scripts/deploy/10_deployRouter.js --network rinkeby  
npx hardhat run scripts/deploy/11_deployMigrator.js --network rinkeby  
npx hardhat run scripts/deploy/12_deploySwapRewards.js --network rinkeby  
npx hardhat run scripts/deploy/13_deployMasterChef.js --network rinkeby  
npx hardhat run scripts/deploy/14_deployAutoHelix.js --network rinkeby  
