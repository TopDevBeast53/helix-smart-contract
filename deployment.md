## Aura Factory and Router

Open `1_initial_migration.js` and update `ADDRESS_OF_WHO_CAN_SET_FEES_ON_PAIR_SWAPS` and `ADDRESS_OF_WHO_WILL_RECEIVE_TRADING_FEES` constants. Make sure `deployAuraFactory` is uncommented.

Run `truffle deploy --network=bsc_testnet` (or mainnet)

Now, copy the address of the factory contract and add it into the FACTORY map to a corresponding env. Comment out `deployAuraFactory` and uncomment `deployAuraRouter`.

Run `truffle deploy --network=bsc_testnet` (or mainnet)

Now, we've deployed router and factory.

NOTE: We will still come back to set the SwapFeeReward contract address.

## Aura Token

Open BEP20.sol and see preMineSupply and maxSupply. PreMine is mined directly to your wallet after the token is deployed. Max Supply is max that can be minted over time. e.g. by Staking chefs. Currently, Max Supply is set to be 1B, and PreMind to 100M. Change if needed.

`truffle compile` after changed.

And then finally deploy by running the following.

`npx hardhat run scripts/deployAuraToken.js --network testnetBSC` (mainnet if needed)

It will print the address where the token is deployed to and who is the owner.

## Referrals Register

Contract resposnbile for referrals registry and referral rewards accumulating and payout.

NOTE: Referral rewards are MINTED in Aura and not taken away from the person who was referred. Therefore, the rewards % are setup when contract is deployed.

Open `deployReferralRegister.js` and update `AuraTokenAddress`. Then run the below command.

`npx hardhat run scripts/deployReferralRegister.js --network testnetBSC`

It would deploy the referral register and add it as a minter to Aura token. Mints are done on withdrawal.


## Master Chef

Main contract which is responsible for farms. But one pool (number 0) it has is for staking Aura and is created by default.

Update all variables: referral register, aura token, how many aura per block etc.

And then run

`npx hardhat run scripts/deployMasterChef.js --network testnetBSC`

It would deploy the contract AND add master chef as a minter to Aura token.

## Auto Aura

Auto-compounding aura token into the MasterChef pool number 0 (which is aura staking pool).

Open `deployAutoAura.js` and update all the constants with contracts addresses we have deployed earlier. Then run

`npx hardhat run scripts/deployAutoAura.js --network testnetBSC`

## Pools (or SmartChefs)

AutoAura was the first pool we have. Now, each of the pools needs to be deployed separately and rewards funds must be deposited into each of the pools individually.

Let's say we want to create a pool for staking token A and getting rewards in token B.

Most likely, for now the token B always be Aura Token.

Open `deploySmartChef.js` and update the variables.

Most important ones are:
* Start Block
* End block
* Reward per block

When setting this numbers you must do the following. Come up with a start block. Decide how much Aura will be given and how much per block.

end block = start block + (total aura amount / aura per block) - 1

i.e. if start block = 123
total aura = 1M, and aura per block = 100, then end block must be 123 + 10^6 / 10^2 - 1 = 123 + 10^4 - 1 = 10122.

Set all the numbers correctly and run

`npx hardhat run scripts/deploySmartChef.js --network testnetBSC`

Now, we've got the contract deployed, however, you MUST fund it from the owner account (the account which deployed the contract). You must deposit (end block - start block + 1) * aura per block aura tokens into it for users to be able to claim their rewards.

DO NOT WORRY, if users don't use all the rewards, you can still withdraw Aura token deposited there for rewards at any time by calling `emergencyRewardWithdraw` function on the deployed contract.

NOW GO AND TRANSFER THE NEEDED AMOUNT OF AURA INTO THE CONTRACT! Go mint some amount of aura to your wallet and deposit it into the contract by literally doing a send from e.g. metamask.

## Aura NFT and Staking Chef

Open `constants` folder and the files in it.

`contracts.js` --> update the aura token address
`env.js` --> update the env name if needed (e.g. main) and rpc url

Run `npx hardhat run scripts/deployAuraNFTStaking.js --network testnetBSC` (or main)

Here will be deployed contracts `AuraNFT`, `AuraChefNFT`, `SwapFeeRewardsWithAP`
1. Deploy `AuraNFT` contract.
2. Deploy `AuraChefNFT` contract.
 * Set deployed `AuraNFT` address as instance of `AuraChefNFT`.
3. Deploy `SwapFeeRewardsWithAP` contract
4. Set all roles of `AuraNFT`
 * Set `AuraChefNFT` address as a staker of `AuraNFT`.
 * Set `deployer` as a minter of `AuraNFT`.
 * Set `SwapFeeRewardsWithAP` address as accruer of `AuraNFT`.
5. Add RewardToken of `AuraChefNFT` with `AURA` token.

Here are the initial variables.
1. `AuraNFT`
  - `initialAuraPoints` : A AuraNFT has AuraPoints amount initially when it is minted.
  	NOTE: Users can only earn AuraPoints through Swap trade.
  		  `SwapFeeRewardsWithAP` calls the function.
  - `levelUpPercent` : When level up, add a percentage(`levelUpPercent`) of your previous AuraPoints.
    e.g. let's say that current level is 2 and current AuraPoints is 50 and `levelUpPercent` is 10.
         When upgrade to 3 Level, new AuraPoints will be `50 * (1 + 10/100)` => `55`

2. `AuraChefNFT
  - `lastRewardBlock` : will set as block number when contract is deployed but you can set on your mind.
  - `startBlock` : the param of the `addNewRewardToken` function that indicates when the block number will be rewarded.
  	If set 0, it will be set as current block number of when executed this function.
  - `rewardPerBlock` : reward will be accrued per block, must not be zero.

  NOTE: Reward is calculated `min(lastRewardBlock-currentBlock, startBlock-currentBlock) * rewardPerBlock` .
  		e.g. let's say that current Block is 100, and startBlock is 200.
  		User can't get any reward until current block is 200.
  
  	Accumulated Tokens per share = `rewardPerBlock * diffBlockNums`. diffBlockNums: diff from startRewardBlock to now
  	So, AuraChefNFT should have AuraToken amount to sufficient as above formula

## Aura NFT Bridge

Now, time to deploy the bridge contract. It will be called by the script doing all the briding work connecting solana and bsc.

Open `deployAuraNFTBridge.js` and update `AuraNFTAddress` with the address of the Aura NFT contract that was deployed.

After that, run

`npx hardhat run scripts/deployAuraNFTBridge.js --network testnetBSC`
