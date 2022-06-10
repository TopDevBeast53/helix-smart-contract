INITIALIZE

The scripts in this directory make the calls necessary to initialize their respective contract's
references to other contracts and should be called after after all contracts have been deployed and 
their addresses added to ../constants/contracts. 

For convenience, listed below are the commands to run each of the scripts in this directory

npx hardhat run scripts/initialize/initHelixChefNft.js --network rinkeby
npx hardhat run scripts/initialize/initHelixToken.js --network rinkeby
npx hardhat run scripts/initialize/initRouter.js --network rinkeby
npx hardhat run scripts/initialize/initFactory.js --network rinkeby
npx hardhat run scripts/initialize/initMasterChef.js --network rinkeby
npx hardhat run scripts/initialize/initFeeMinter.js --network rinkeby
npx hardhat run scripts/initialize/initHelixNft.js --network rinkeby
npx hardhat run scripts/initialize/initHelixNftBridge.js --network rinkeby
npx hardhat run scripts/initialize/initReferralRegister.js --network rinkeby
