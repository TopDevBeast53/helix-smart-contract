DEPLOY

The scripts in this directory deploy their respective contracts.
These scripts should be run in conjunction with those in ../initialize to ensure that each
contract is correctly configured.

The expected call-order to deploy the exchange is:
helixToken
ownerMultiSig
treasuryMultiSig
devTeamMultiSig
timelock
helixNft
feeMinter
helixNftBridge
helixChefNft
feeHandler
referralRegister
helixVault
factory
oracleFactory
router
migrator
swapRewards
masterChef
autoHelix
multicall
paymentSplitter
routerProxy


