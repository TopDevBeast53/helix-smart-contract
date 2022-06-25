The scripts in this directory are grouped according to the order in which they are expected to be called. 

1. Use `deploy` to deploy the contracts and only set those values assigned by their constructors.
2. Use `register` to build the connections between contracts.
3. Use `setter` to make any additional setter calls.
4. Use `transfer` to transfer the ownership of contracts to the multisig/timelock contracts.

