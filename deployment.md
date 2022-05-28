## 1. Helix Factory and Router

Check and update all variables:
>`setterFeeOnPairSwaps` from `src/scripts/constants/addresses.js`.  
>`poolReceiveTradFee` from `src/scripts/constants/addresses.js`. 

First of all, should deploy Helix Factory, for it, make sure `deployHelixFactory()` is uncommented.

Run `npx hardhat run scripts/1_deployFactoryRouter.js --network testnetBSC` (or mainnet)

Now, copy the address of the factory contract and **put it into the `factory` map** to `scripts/constants/contracts.js`.
copy *INIT_CODE_HASH* and **put it into `FACTORY_INIT_CODE_HASH`** to `scripts/constants/initials.js` and **put it into `HelixLibrary.sol`**

Comment out `deployHelixFactory()` and uncomment `deployHelixRouter()`.

Run `npx hardhat run scripts/1_deployFactoryRouter.js --network testnetBSC` (or mainnet)

Now, copy the address of the Router contract and **put it into the `router` map** to `scripts/constants/contracts.js`.
## 2. Helix Token

Open BEP20.sol and see `preMineSupply` and `maxSupply`. PreMine is mined directly to your wallet after the token is deployed. Max Supply is max that can be minted over time. e.g. by Staking chefs. Currently, Max Supply is set to be 1B, and PreMind to 100M. Change if needed.

Run `npx hardhat run scripts/2_deployHelixToken.js --network testnetBSC` (or mainnet)

Now, copy the address of the HelixToken contract and **put it into the `helixToken` map** to `scripts/constants/contracts.js`.

## 3. OracleFactory

OracleFactory serves as the interface for other contracts to interact with Oracles. 

The OracleFactory can be deployed any time **after the factory is deployed** but must be deployed **before factory.createPair** is called. 
It's passed the factory address as a constuctor argument.

Check and update all variables:
>`helixFactory` address from `src/scripts/constants/contracts.js`.  

Run `npx hardhat run scripts/3_deployOracleFactory.js --network testnetBSC` (or mainnet)

It will add OracleFactory contract address to HelixFactory.

Now, copy the address of the Oracle contract and **put it into the `oracle` map** to `scripts/constants/contracts.js`.
## 4. Referral Register

Contract resposnbile for referrals registry and referral rewards accumulating and payout.

NOTE: Referral rewards are MINTED in Helix and not taken away from the person who was referred. Therefore, the rewards % are setup when contract is deployed.

Check and update all variables:
>`helixToken` address from `src/scripts/constants/contracts.js`.  
>`REFERRAL_STAKING_FEE_PERCENT` from `src/scripts/constants/initials.js`.  
>`REFERRAL_SWAP_FEE_PERCENT` from `src/scripts/constants/initials.js`.

Run `npx hardhat run scripts/4_deployReferralRegister.js --network testnetBSC` (or mainnet)

It would deploy the referral register and add it as a minter to Helix token. Mints are done on withdrawal.

Now, copy the address of the Referrals Register contract and **put it into the `referralRegister` map** to `scripts/constants/contracts.js`.

## 5. Master Chef

Main contract which is responsible for farms. But one pool (number 0) it has is for staking Helix and is created by default.

Check and update all variables:
>`HelixTokenAddress` from `src/scripts/constants/contracts.js`.  
>`ReferralRegister` from `src/scripts/constants/contracts.js`.  
>`DeveloperAddress` from `src/scripts/constants/addresses.js`.  
>`StartBlock` from `src/scripts/constants/initials.js`.  
>`HelixTokenRewardPerBlock` from `src/scripts/constants/initials.js`.  
>`StakingPercent` from `src/scripts/constants/initials.js`.  
>`DevPercent` from `src/scripts/constants/initials.js`.  

Run `npx hardhat run scripts/5_deployMasterChef.js --network testnetBSC`
Now, copy the address of the MasterChef contract and **put it into the `masterChef` map** to `scripts/constants/contracts.js`.

It would deploy the contract AND add master chef as a minter to Helix token.

## 6. Auto Helix

Auto-compounding helix token into the MasterChef pool number 0 (which is helix staking pool).

Check and update all variables:
>`HelixTokenAddress` from `src/scripts/constants/contracts.js`.  
>`MasterChefAddress` from `src/scripts/constants/contracts.js`.  
>`TreasuryAddress` from `src/scripts/constants/addresses.js`.  

Run `npx hardhat run scripts/6_deployAutoHelix.js --network testnetBSC`

Now, copy the address of the Auto Helix contract and **put it into the `autoHelix` map** to `scripts/constants/contracts.js`.

## 7. Helix NFT and HelixChefNFT

Check and update all variables:
>`StakingTokenAddress` from `src/scripts/constants/addresses.js`(e.g. BUSD for now).  
>`RewardTokenAddress` from `src/scripts/constants/contracts.js`(HelixToken for now).  
>`StartBlock` from `src/scripts/constants/initials.js`.  
>`EndBlock` from `src/scripts/constants/initials.js`.  
>`RewardPerBlock` from `src/scripts/constants/initials.js`.

Run `npx hardhat run scripts/7_deployHelixNFTStaking.js --network testnetBSC` (or main)
Copy the address of the Helix NFT contract and **put it into the `helixNFT` map** to `scripts/constants/contracts.js`.
Copy the address of the Helix NFT Chef  contract and **put it into the `helixNFTChef` map** to `scripts/constants/contracts.js`.

Here will be deployed contracts `HelixNFT`, `HelixChefNFT`
1. Deploy `HelixNFT` contract.
2. Deploy `HelixChefNFT` contract.
 * Set deployed `HelixNFT` address as instance of `HelixChefNFT`.
3. Set all roles of `HelixNFT`
 * Set `HelixChefNFT` address as a staker of `HelixNFT`.
 * Set `deployer` as a minter of `HelixNFT`.
4. Add RewardToken of `HelixChefNFT` with `HELIX` token.

Here are the initial variables.
1. `HelixNFT`
  - `initialHelixPoints` : A HelixNFT has HelixPoints amount initially when it is minted.
  	NOTE: Users can only earn HelixPoints through Swap trade.
  		  `SwapRewards` calls the function.
  - `levelUpPercent` : When level up, add a percentage(`levelUpPercent`) of your previous HelixPoints.
    e.g. let's say that current level is 2 and current HelixPoints is 50 and `levelUpPercent` is 10.
         When upgrade to 3 Level, new HelixPoints will be `50 * (1 + 10/100)` => `55`

2. `HelixChefNFT`
  - `lastRewardBlock` : will set as block number when contract is deployed but you can set on your mind.
  - `startBlock` : the param of the `addNewRewardToken` function that indicates when the block number will be rewarded.
  	If set 0, it will be set as current block number of when executed this function.
  - `rewardPerBlock` : reward will be accrued per block, must not be zero.

  NOTE: Reward is calculated `min(lastRewardBlock-currentBlock, startBlock-currentBlock) * rewardPerBlock` .
  		e.g. let's say that current Block is 100, and startBlock is 200.
  		User can't get any reward until current block is 200.
  
  	Accumulated Tokens per share = `rewardPerBlock * diffBlockNums`. diffBlockNums: diff from startRewardBlock to now
  	So, HelixChefNFT should have HelixToken amount to sufficient as above formula

## 8. Helix NFT Bridge

Now, time to deploy the bridge contract. It will be called by the script doing all the briding work connecting solana and bsc.

Check and update all variables:
>`helixNFTAddress` from `src/scripts/constants/contracts.js`.  

Run `npx hardhat run scripts/8_deployHelixNFTBridge.js --network testnetBSC`
Copy the address of the Helix NFT contract and **put it into the `helixNFTBridge` map** to `scripts/constants/contracts.js`.

## 10. SwapRewards

It's called by the router when the user performs a token swap and will credit helixToken/hpToken to the user's balance
and credit helixToken to the swap caller referrer's balance, if one is set.

Check and update all variables:
>`factoryAddress` from `src/scripts/constants/contracts.js`.  
>`routerAddress` from `src/scripts/constants/contracts.js`.  
>`oracleFactoryAddress` from `src/scripts/constants/contracts.js`.  
>`referralRegisterAddress` from `src/scripts/constants/contracts.js`.  
>`helixTokenAddress` from `src/scripts/constants/contracts.js`.  
>`helixNFTAddress` from `src/scripts/constants/contracts.js`.  
>`hpTokenAddress` from `src/scripts/constants/contracts.js`(Now helixLP).  

These addresses are passed to the constructor as arguments, including the following values

splitRewardPercent: sets the percent split in rewards between Helix/Ap. 
helixRewardPercent: sets the percent of the reward granted in Helix
apRewardPercent: sets the percent of the reward granted in Ap
Note that all percentages in SwapRewards are out of 1000, so 0 -> 0%, 500 -> 50%, 1000 -> 100%

Run `npx hardhat run scripts/10_deploySwapRewards.js --network testnetBSC` (or mainnet)

The script does and must register SwapRewards with the following contracts' function calls
Router.setSwapRewards()
ReferralRegister.addRecorder()
HelixToken.addMinter()
HelixNFT.addAccruer()

Copy the address of the Swap Fee contract and **put it into the `swapRewards` map** to `scripts/constants/contracts.js`.

## 11. HelixMigrator

Migrates liquidity an external routers to MigrateLiquidity's set router via a single migrateLiquidity function.

Check and update all variables:
>`routerAddress` from `src/scripts/constants/contracts.js`.  

Run `npx hardhat run scripts/11_deployMigrator.js --network testnetBSC` (or mainnet)
Copy the address of the Helix Migrator contract and **put it into the `helixMigrator` map** to `scripts/constants/contracts.js`.

## 12. Token Tools

Intended to be used by the frontend for making efficient queries about LP token pairs and their holders
e.g. getStakedTokenPairs which returns all the token pairs in which a given address has a positive balance,
including the token addresses in that pair, their balances, and their symbols.

Is not dependent on any other contracts, has no constructor, and maintains no state.

Run `npx hardhat run scripts/12_deployTokenTools.js --network testnetBSC` (or mainnet)
Copy the address of the Token Tools contract and **put it into the `tokenTools` map** to `scripts/constants/contracts.js`.

## 13. Vault

Run `npx hardhat run scripts/13_deployHelixVault.js --network testnetBSC` (or mainnet)
Copy the address of the Token Tools contract and **put it into the `helixVault` map** to `scripts/constants/contracts.js`.
