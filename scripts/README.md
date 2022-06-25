The scripts in this directory are grouped according to the order in which they are expected to be called. 

1. Use `deploy` to deploy the contracts and only set those values assigned by their constructors.
2. Use `connect` to build the connections between contracts. eg. Router.setSwapRewards
3. Use `setter` to make any additional setter calls. eg. ReferralRegister.setSwapRewardPercent 
4. Use `transfer` to transfer the ownership of contracts to the multisig/timelock contracts. eg. oracleFactory.transferOwnership
5. Use `test` to interact with the deployed contracts and test the output
6. Use `verify` to verify the contracts and expose their code

