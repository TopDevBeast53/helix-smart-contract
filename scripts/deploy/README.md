DEPLOY

The scripts in this directory deploy their respective contracts.
These scripts should be run in conjunction with those in ../initialize to ensure that each
contract is correctly configured.

For convenience, listed below are the commands to deploy each contract to the rinkeby network:  
Take care to update each contract's deployed address(es) in ../constants/contracts.js.

npx hardhat run scripts/0_deploy/0_deployOwnerMultiSig.js --network ropsten  
npx hardhat run scripts/0_deploy/1_deployTreasuryMultiSig.js --network ropsten  
npx hardhat run scripts/0_deploy/2_deployDevTeamMultiSig.js --network ropsten  
npx hardhat run scripts/0_deploy/3_deployTimelock.js --network ropsten  
npx hardhat run scripts/0_deploy/4_deployHelixToken.js --network ropsten  
npx hardhat run scripts/0_deploy/5_deployHelixNFT.js --network ropsten  
npx hardhat run scripts/0_deploy/6_deployFeeMinter.js --network ropsten  
npx hardhat run scripts/0_deploy/7_deployHelixNFTBridge.js --network ropsten  
npx hardhat run scripts/0_deploy/8_deployHelixChefNFT.js --network ropsten  
npx hardhat run scripts/0_deploy/9_deployFeeHandler.js --network ropsten  
npx hardhat run scripts/0_deploy/10_deployReferralRegister.js --network ropsten  
npx hardhat run scripts/0_deploy/11_deployHelixVault.js --network ropsten  
npx hardhat run scripts/0_deploy/12_deployFactory.js --network ropsten  
npx hardhat run scripts/0_deploy/13_deployOracleFactory.js --network ropsten  
npx hardhat run scripts/0_deploy/14_deployRouter.js --network ropsten  
npx hardhat run scripts/0_deploy/15_deployMigrator.js --network ropsten  
npx hardhat run scripts/0_deploy/16_deploySwapRewards.js --network ropsten  
npx hardhat run scripts/0_deploy/17_deployMasterChef.js --network ropsten  
npx hardhat run scripts/0_deploy/18_deployAutoHelix.js --network ropsten  
npx hardhat run scripts/0_deploy/19_deployMulticall.js --network ropsten  
npx hardhat run scripts/0_deploy/20_deployYieldSwap.js --network ropsten  
npx hardhat run scripts/0_deploy/21_deployLpSwap.js --network ropsten  
