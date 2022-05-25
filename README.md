# HELIX
### Helix DEX Backend and Smart Contracts

This repo contains the smart contracts used by the Helix DEX categorized by function and their related scripts and tools. 

### Smart Contracts

The `contracts` directory contains the bulk of the code supporting the Helix DEX backend.

| Category | Description |
| :------- | :---------- |
| Fees | Collect and handle administrative fees |
| Interfaces | Interfaces implemented by the contracts in this repo |
| Libraries | Libraries used by the contracts in this repo |
| Migrations | Migrate liquidity tokens from external DEXs to Helix DEX |
| Oracles | Consult for token conversions |
| P2P | Peer-to-peer token pair swaps |
| Presales | Initial HELIX token public offering |
| Referrals | Earn and distribute referral rewards during transactions |
| Staking | Stake tokens and earn rewards |
| StakingNFT | Stake NFTs and earn rewards |
| Swaps | Swap between token pairs |
| Test | Contracts used in the early stages of development |
| Tokens | Tokens distributed by the Helix DEX |
| Utils | Miscellaneous utility contracts |
| Vaults | Lock tokens and earn rewards |

### Scripts

The `scripts` directory contains the code for deploying, upgrading, and interacting with deployed Helix contracts. It also contains the `constants` directory which holds references to deployed contract addresses and contract initial configuration values.

### Tests

There are two directories containing tests for Helix DEX smart contracts: `mocha_tests` and `test`. The former may be run using `mocha` and the latter using `truffle test`. 
