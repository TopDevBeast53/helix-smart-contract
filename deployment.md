## 1. Aura Factory and Router

Check and update all variables:
>`setterFeeOnPairSwaps` from `src/scripts/constants/addresses.js`.  
>`poolReceiveTradFee` from `src/scripts/constants/addresses.js`. 

First of all, should deploy Aura Factory, for it, make sure `deployAuraFactory()` is uncommented.

Run `npx hardhat run scripts/1_deployFactoryRouter.js --network testnetBSC` (or mainnet)

Now, copy the address of the factory contract and **put it into the `factory` map** to `scripts/constants/contracts.js`.
copy *INIT_CODE_HASH* and **put it into `FACTORY_INIT_CODE_HASH`** to `scripts/constants/initials.js` and **put it into `AuraLibrary.sol`**

Comment out `deployAuraFactory()` and uncomment `deployAuraRouter()`.

Run `npx hardhat run scripts/1_deployFactoryRouter.js --network testnetBSC` (or mainnet)

Now, copy the address of the Router contract and **put it into the `router` map** to `scripts/constants/contracts.js`.
## 2. Aura Token

Open BEP20.sol and see `preMineSupply` and `maxSupply`. PreMine is mined directly to your wallet after the token is deployed. Max Supply is max that can be minted over time. e.g. by Staking chefs. Currently, Max Supply is set to be 1B, and PreMind to 100M. Change if needed.

Run `npx hardhat run scripts/2_deployAuraToken.js --network testnetBSC` (or mainnet)

Now, copy the address of the AuraToken contract and **put it into the `auraToken` map** to `scripts/constants/contracts.js`.

## 3. OracleFactory

OracleFactory serves as the interface for other contracts to interact with Oracles. 

The OracleFactory can be deployed any time **after the factory is deployed** but must be deployed **before factory.createPair** is called. 
It's passed the factory address as a constuctor argument.

Check and update all variables:
>`auraFactory` address from `src/scripts/constants/contracts.js`.  

Run `npx hardhat run scripts/3_deployOracleFactory.js --network testnetBSC` (or mainnet)

It will add OracleFactory contract address to AuraFactory.

Now, copy the address of the Oracle contract and **put it into the `oracle` map** to `scripts/constants/contracts.js`.
## 4. Referral Register

Contract resposnbile for referrals registry and referral rewards accumulating and payout.

NOTE: Referral rewards are MINTED in Aura and not taken away from the person who was referred. Therefore, the rewards % are setup when contract is deployed.

Check and update all variables:
>`auraToken` address from `src/scripts/constants/contracts.js`.  
>`REFERRAL_STAKING_FEE_PERCENT` from `src/scripts/constants/initials.js`.  
>`REFERRAL_SWAP_FEE_PERCENT` from `src/scripts/constants/initials.js`.

Run `npx hardhat run scripts/4_deployReferralRegister.js --network testnetBSC` (or mainnet)

It would deploy the referral register and add it as a minter to Aura token. Mints are done on withdrawal.

Now, copy the address of the Referrals Register contract and **put it into the `referralRegister` map** to `scripts/constants/contracts.js`.

## 5. Master Chef

Main contract which is responsible for farms. But one pool (number 0) it has is for staking Aura and is created by default.

Check and update all variables:
>`AuraTokenAddress` from `src/scripts/constants/contracts.js`.  
>`ReferralRegister` from `src/scripts/constants/contracts.js`.  
>`DeveloperAddress` from `src/scripts/constants/addresses.js`.  
>`StartBlock` from `src/scripts/constants/initials.js`.  
>`AuraTokenRewardPerBlock` from `src/scripts/constants/initials.js`.  
>`StakingPercent` from `src/scripts/constants/initials.js`.  
>`DevPercent` from `src/scripts/constants/initials.js`.  

Run `npx hardhat run scripts/5_deployMasterChef.js --network testnetBSC`
Now, copy the address of the MasterChef contract and **put it into the `masterChef` map** to `scripts/constants/contracts.js`.

It would deploy the contract AND add master chef as a minter to Aura token.

## 6. Auto Aura

Auto-compounding aura token into the MasterChef pool number 0 (which is aura staking pool).

Check and update all variables:
>`AuraTokenAddress` from `src/scripts/constants/contracts.js`.  
>`MasterChefAddress` from `src/scripts/constants/contracts.js`.  
>`TreasuryAddress` from `src/scripts/constants/addresses.js`.  

Run `npx hardhat run scripts/6_deployAutoAura.js --network testnetBSC`

Now, copy the address of the Auto Aura contract and **put it into the `autoAura` map** to `scripts/constants/contracts.js`.

## 7. Pools (or SmartChefs)

AutoAura was the first pool we have. Now, each of the pools needs to be deployed separately and rewards funds must be deposited into each of the pools individually.

Let's say we want to create a pool for staking token A and getting rewards in token B.

Most likely, for now the token B always be Aura Token.

Check and update all variables:
>`StakingTokenAddress` from `src/scripts/constants/addresses.js`(e.g. BUSD for now).  
>`RewardTokenAddress` from `src/scripts/constants/contracts.js`(AuraToken for now).  
>`StartBlock` from `src/scripts/constants/initials.js`.  
>`EndBlock` from `src/scripts/constants/initials.js`.  
>`RewardPerBlock` from `src/scripts/constants/initials.js`.  

When setting this numbers you must do the following. Come up with a start block. Decide how much Aura will be given and how much per block.

end block = start block + (total aura amount / aura per block) - 1

i.e. if start block = 123
total aura = 1M, and aura per block = 100, then end block must be 123 + 10^6 / 10^2 - 1 = 123 + 10^4 - 1 = 10122.

Run `npx hardhat run scripts/7_deploySmartChef.js --network testnetBSC`
Now, copy the address of the Smart Chef contract and **put it into the `smartChef` map** to `scripts/constants/contracts.js`.

Now, we've got the contract deployed, however, you MUST fund it from the owner account (the account which deployed the contract). You must deposit (end block - start block + 1) * aura per block aura tokens into it for users to be able to claim their rewards.

DO NOT WORRY, if users don't use all the rewards, you can still withdraw Aura token deposited there for rewards at any time by calling `emergencyRewardWithdraw` function on the deployed contract.

NOW GO AND TRANSFER THE NEEDED AMOUNT OF AURA INTO THE CONTRACT! Go mint some amount of aura to your wallet and deposit it into the contract by literally doing a send from e.g. metamask.

## 8. Aura NFT and AuraChefNFT

Check and update all variables:
>`StakingTokenAddress` from `src/scripts/constants/addresses.js`(e.g. BUSD for now).  
>`RewardTokenAddress` from `src/scripts/constants/contracts.js`(AuraToken for now).  
>`StartBlock` from `src/scripts/constants/initials.js`.  
>`EndBlock` from `src/scripts/constants/initials.js`.  
>`RewardPerBlock` from `src/scripts/constants/initials.js`.

Run `npx hardhat run scripts/8_deployAuraNFTStaking.js --network testnetBSC` (or main)
Copy the address of the Aura NFT contract and **put it into the `auraNFT` map** to `scripts/constants/contracts.js`.
Copy the address of the Aura NFT Chef  contract and **put it into the `auraNFTChef` map** to `scripts/constants/contracts.js`.

Here will be deployed contracts `AuraNFT`, `AuraChefNFT`
1. Deploy `AuraNFT` contract.
2. Deploy `AuraChefNFT` contract.
 * Set deployed `AuraNFT` address as instance of `AuraChefNFT`.
3. Set all roles of `AuraNFT`
 * Set `AuraChefNFT` address as a staker of `AuraNFT`.
 * Set `deployer` as a minter of `AuraNFT`.
4. Add RewardToken of `AuraChefNFT` with `AURA` token.

Here are the initial variables.
1. `AuraNFT`
  - `initialAuraPoints` : A AuraNFT has AuraPoints amount initially when it is minted.
  	NOTE: Users can only earn AuraPoints through Swap trade.
  		  `SwapRewards` calls the function.
  - `levelUpPercent` : When level up, add a percentage(`levelUpPercent`) of your previous AuraPoints.
    e.g. let's say that current level is 2 and current AuraPoints is 50 and `levelUpPercent` is 10.
         When upgrade to 3 Level, new AuraPoints will be `50 * (1 + 10/100)` => `55`

2. `AuraChefNFT`
  - `lastRewardBlock` : will set as block number when contract is deployed but you can set on your mind.
  - `startBlock` : the param of the `addNewRewardToken` function that indicates when the block number will be rewarded.
  	If set 0, it will be set as current block number of when executed this function.
  - `rewardPerBlock` : reward will be accrued per block, must not be zero.

  NOTE: Reward is calculated `min(lastRewardBlock-currentBlock, startBlock-currentBlock) * rewardPerBlock` .
  		e.g. let's say that current Block is 100, and startBlock is 200.
  		User can't get any reward until current block is 200.
  
  	Accumulated Tokens per share = `rewardPerBlock * diffBlockNums`. diffBlockNums: diff from startRewardBlock to now
  	So, AuraChefNFT should have AuraToken amount to sufficient as above formula

## 9. Aura NFT Bridge

Now, time to deploy the bridge contract. It will be called by the script doing all the briding work connecting solana and bsc.

Check and update all variables:
>`auraNFTAddress` from `src/scripts/constants/contracts.js`.  

Run `npx hardhat run scripts/9_deployAuraNFTBridge.js --network testnetBSC`
Copy the address of the Aura NFT contract and **put it into the `auraNFTBridge` map** to `scripts/constants/contracts.js`.

## 10. AP Token / Aura LP

This is the Aura Points / Liquidity Pool token

Run `npx hardhat run scripts/10_deployApToken.js --network testnetBSC` (or mainnet)

Now, copy the address of the ApToken contract and **put it into the `apToken` map** to `scripts/constants/contracts.js`.

## 11. SwapRewards

It's called by the router when the user performs a token swap and will credit auraToken/apToken to the user's balance
and credit auraToken to the swap caller referrer's balance, if one is set.

Check and update all variables:
>`factoryAddress` from `src/scripts/constants/contracts.js`.  
>`routerAddress` from `src/scripts/constants/contracts.js`.  
>`oracleFactoryAddress` from `src/scripts/constants/contracts.js`.  
>`referralRegisterAddress` from `src/scripts/constants/contracts.js`.  
>`auraTokenAddress` from `src/scripts/constants/contracts.js`.  
>`auraNFTAddress` from `src/scripts/constants/contracts.js`.  
>`apTokenAddress` from `src/scripts/constants/contracts.js`(Now auraLP).  

These addresses are passed to the constructor as arguments, including the following values

splitRewardPercent: sets the percent split in rewards between Aura/Ap. 
auraRewardPercent: sets the percent of the reward granted in Aura
apRewardPercent: sets the percent of the reward granted in Ap
Note that all percentages in SwapRewards are out of 1000, so 0 -> 0%, 500 -> 50%, 1000 -> 100%

Run `npx hardhat run scripts/11_deploySwapRewards.js --network testnetBSC` (or mainnet)

The script does and must register SwapRewards with the following contracts' function calls
Router.setSwapRewards()
ReferralRegister.addRecorder()
AuraToken.addMinter()
AuraNFT.addAccruer()

Copy the address of the Swap Fee contract and **put it into the `swapRewards` map** to `scripts/constants/contracts.js`.

## 12. AuraMigrator

Migrates liquidity an external routers to MigrateLiquidity's set router via a single migrateLiquidity function.

Check and update all variables:
>`routerAddress` from `src/scripts/constants/contracts.js`.  

Run `npx hardhat run scripts/12_deployMigrator.js --network testnetBSC` (or mainnet)
Copy the address of the Aura Migrator contract and **put it into the `auraMigrator` map** to `scripts/constants/contracts.js`.

## 13. Token Tools

Intended to be used by the frontend for making efficient queries about LP token pairs and their holders
e.g. getStakedTokenPairs which returns all the token pairs in which a given address has a positive balance,
including the token addresses in that pair, their balances, and their symbols.

Is not dependent on any other contracts, has no constructor, and maintains no state.

Run `npx hardhat run scripts/13_deployTokenTools.js --network testnetBSC` (or mainnet)
Copy the address of the Token Tools contract and **put it into the `tokenTools` map** to `scripts/constants/contracts.js`.
