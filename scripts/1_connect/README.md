INITIALIZE

The scripts in this directory make the calls necessary to initialize their respective contract's
references to other contracts and should be called after after all contracts have been deployed and 
their addresses added to ../constants/contracts. 

For each script, calls should only be made of the contract in the scrip's title, e.g. calls should
only be made to Router functions in initRouter.

Further, calls made in these scripts should only be made to register once contract with another,
e.g. ReferralRegister.setFeeMinter(address) and not ReferralRegister.addReferrer(uint).

For convenience, listed below are the commands to run each of the scripts in this directory

npx hardhat run scripts/1_connect/initFactory.js --network ropsten
npx hardhat run scripts/1_connect/initFeeMinter.js --network ropsten
npx hardhat run scripts/1_connect/initHelixChefNft.js --network ropsten
npx hardhat run scripts/1_connect/initHelixNft.js --network ropsten
npx hardhat run scripts/1_connect/initHelixNftBridge.js --network ropsten
npx hardhat run scripts/1_connect/initHelixToken.js --network ropsten
npx hardhat run scripts/1_connect/initMasterChef.js --network ropsten
npx hardhat run scripts/1_connect/initReferralRegister.js --network ropsten
npx hardhat run scripts/1_connect/initRouter.js --network ropsten
