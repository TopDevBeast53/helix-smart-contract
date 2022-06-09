DEPLOY

The scripts in this directory deploy their respective contracts.
These scripts should be run in conjunction with those in ../initialize to ensure that each
contract is correctly configured.

For convenience, listed below are the commands to deploy each contract to the rinkeby network:  
Take care to update each contract's deployed address(es) in ../constants/contracts.js.

npx hardhat run scripts/1__deployHelixNFT.js --network rinkeby  
npx hardhat run scripts/2_deployFeeMinter.js --network rinkeby  
npx hardhat run scripts/3_deployHelixNFTBridge.js --network rinkeby  
npx hardhat run scripts/4_deployHelixChefNFT.js --network rinkeby  
npx hardhat run scripts/5_deployFeeHandler.js --network rinkeby  
npx hardhat run scripts/6_deployReferralRegister.js --network rinkeby  
npx hardhat run scripts/7_deployHelixVault.js --network rinkeby  
npx hardhat run scripts/8_deployFactory.js --network rinkeby  
npx hardhat run scripts/9_deployOracleFactory.js --network rinkeby  
npx hardhat run scripts/10_deployRouter.js --network rinkeby  
npx hardhat run scripts/11_deployMigrator.js --network rinkeby  
npx hardhat run scripts/12_deploySwapRewards.js --network rinkeby  
npx hardhat run scripts/13_deployMasterChef.js --network rinkeby  
npx hardhat run scripts/14_deployAutoHelix.js --network rinkeby  
