
const env = require("./env")
const contracts = require("./contracts")

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const vaultAddress = contracts.helixVault[env.network]

module.exports = {
    FACTORY_INIT_CODE_HASH: {
        1: '',
        4: '0xc28107fd87760cfb4e1668f5cb7a07b1049eaedf62697db36fb894567a372da6',
    },
    
    // --------- FeeHandler --------- //

    FEE_HANDLER_DEFAULT_NFT_CHEF_PERCENT:{
        1: 33,      // 33%
        3: 33,
        4: 33,
    },

    FEE_HANDLER_HELIX_VAULT_NFT_CHEF_PERCENT: {
        1: 33,      // 33%
        3: 33,
        4: 33,
    },

    FEE_HANDLER_REFERRAL_REGISTER_NFT_CHEF_PERCENT: {
        1: 50,      // 50%
        3: 50,
        4: 50,
    },

    FEE_HANDLER_LP_SWAP_NFT_CHEF_PERCENT: {
        1: 33,      // 33%
        3: 33,
        4: 33,
    },

    FEE_HANDLER_YIELD_SWAP_NFT_CHEF_PERCENT: {
        1: 33,      // 33%
        3: 33,
        4: 33,
    },

    // --------- Referral Register --------- //

    REFERRAL_STAKE_REWARD_PERCENT: {
        1: 5, // 5%
        3: 5,
        4: 5,
    },
    REFERRAL_SWAP_REWARD_PERCENT: {
        1: 5, // 5%
        3: 5,
        4: 5,
    },
    REFERRAL_LAST_MINT_BLOCK: {
        1: 0, // if 0, will be set with block.number when deploy
        3: 0,
        4: 0,
    },
    REFERRAL_COLLECTOR_PERCENT: {
        1: 1000, // 10.00%
        3: 1000, 
        4: 1000,
    },

    // --------- MasterChef --------- //

    MASTERCHEF_START_BLOCK : {
        1: 0, // if 0, will be set with block.number when deploy
        3: 0,
        4: 0,
    },
    MASTERCHEF_STAKING_PERCENT : {
        1: 714000,
        3: 714000,
        4: 714000,
    },
    MASTERCHEF_DEV_PERCENT : {
        1: 286000,
        3: 286000,
        4: 286000,
    },
    MASTERCHEF_LPTOKEN_ADDRESSES: {
        //HELIX-WETH, DAI-USDC, USDC-WETH, DAI-WETH, USDT-USDC
        3: ['0x674f337EacE3Cb33907daAdA40Ba081326f19022',
            '0xDF7E7d20eF68Dc304f0C446def7E2eaB4A877fdD',
            '0xA8bBC7bF44FBFA4218654676095bA6af9A15877B',
            '0x84F1889112009AA2418AEa8FC66c1e45eFb3Adc9',
            '0x971a6BbC05fCdDbA1dD65dCE9B247831fc167bEf'],
        4: ['0x4d762164f26DbfD16634fe933D1f6C7f72f08531',
            '0xB761cAb861Ba423239E852b7d628c5a14A6fb474',
            '0x8354fA5b6941b2ca5aD014aB56E69646bf4292F5',
            '0xaE25d607bB327A7353dbbbdFFc234Cbd3a0E9b29',
            '0xd87e648ccca6C944FA1A0aACDb4d0577518323f3']
    },
    MASTERCHEF_ALLOC_POINTS:{
        //HELIX-WETH, DAI-USDC, USDC-WETH, DAI-WETH, USDT-USDC
        1: [25000, 1000, 2500, 2500, 1000],
        3: [3500, 1500, 1500, 1500, 1500],
        4: [3500, 1500, 1500, 1500, 1500]
    },

    // --------- Helix Vault --------- //
    HELIX_VAULT_START_BLOCK : {
        1: 0, // if 0, will be set with block.number when deploy
        3: 0,
        4: 0,
    },

    //block when rewards are no longer being given away
    HELIX_VAULT_LAST_REWARD_BLOCK : {
        1: 1972243972, // June 30, 2032
        3: 1972243972,
        4: 1972243972,
    },

    HELIX_VAULT_COLLECTOR_PERCENT: {
        1: 150,     // 1.50%
        3: 1000,    // 10.00%
        4: 1000,
    },

    // --------- Fee Minter --------- //
    
    // Represents the sum of desired to mint per block rates * 10^18
    // Farming Rewards: 62.5%
    // Vault Rewards: 9.375%
    // Referral Rewards: 3.125%
    // Team Emissions: 25%
    FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK: {
        1: '8000000000000000000',
        3: '10000000000000000000',
        4: '10000000000000000000'
    },

    FEE_MINTER_MINTERS: {
        1: [masterChefAddress, referralRegisterAddress, vaultAddress],
        3: [masterChefAddress, referralRegisterAddress, vaultAddress],
        4: [masterChefAddress, referralRegisterAddress, vaultAddress],
    },

    // Represents the percents of the to mint per block rate to delegate to each task
    // Percents to each task with 2 decimals of precision
    // Chef:        87.5%     (Stake: 62.5% + Dev Team: 25%)
    // Referral:     3.13%
    // Vault:        9.37%
    // Sum:        100.00%
 
    FEE_MINTER_TO_MINT_PERCENTS: {
        1: [8750, 313, 937],
        3: [8750, 313, 937],
        4: [8750, 313, 937],
    },

    // --------- Treasury MultiSig --------- //
    
    TREASURY_MULTISIG_ADMINS: {
        1: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        3: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
        4: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
    },

    TREASURY_MULTISIG_OWNERS: {
        1: ['0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c'],
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
    },

    TREASURY_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
    },

    TREASURY_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
    },

    // --------- Owner MultiSig --------- //
    
    OWNER_MULTISIG_ADMINS: {
        1: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        3: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
        4: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
    },

    OWNER_MULTISIG_OWNERS: {
        1: ['0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c'],
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
    },

    OWNER_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
    },

    OWNER_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
    },

    // --------- Dev Team MultiSig --------- //
    
    DEV_TEAM_MULTISIG_ADMINS: {
        1: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        3: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
        4: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
    },

    DEV_TEAM_MULTISIG_OWNERS: {
        1: ['0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c'],
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
    },

    DEV_TEAM_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
    },

    DEV_TEAM_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
    },

    // --------- Timelock --------- //
    
    TIMELOCK_MIN_DELAY: {
        1: 21600,   // 6 hours 
        3: 21600,   // 6 hours 
        4: 0,   // 6 hours 
    },

    TIMELOCK_PROPOSERS: {
        1: [],
        3: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
        4: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
    },

    TIMELOCK_EXECUTORS: {
        1: ['0x0000000000000000000000000000000000000000'],  // Anyone can propose - https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
    },

    // --------- YieldSwap --------- //
    
    YIELD_SWAP_MIN_LOCK_DURATION: {
        1: 300, 
        3: 300, 
        4: 300, 
    },
    
    YIELD_SWAP_MAX_LOCK_DURATION: {
        1: 0,
        3: 31536000,    // 1 year in seconds
        4: 31536000,    // 1 year in seconds
    },

    YIELD_SWAP_COLLECTOR_PERCENT: {
        1: 50, // 0.50%
        3: 50, // 0.50%
        4: 50,
    },

    // --------- LpSwap --------- //
    
    LP_SWAP_COLLECTOR_PERCENT: {
        1: 50, // 0.50% 
        3: 50, // 0.50%
        4: 50, 
    },

    // --------- Bridge --------- //

    BRIDGE_ADMIN_ADDRESS: {
        3: '0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57', 
        4: '0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57', 
    },
    
    BRIDGE_FEE_ETH_AMOUNT: {
        1: '1000000000000000', //0.001 ether  
        3: '1000000000000000', //0.001 ether  
        4: '1000000000000000', //0.001 ether 
    },


    // --------- VIP Presale --------- //

    // Input token address
    VIP_PRESALE_INPUT_TOKEN: {
        1: '',
        4: '',
        56: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',   // BUSD https://bscscan.com/address/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        97: '0xa34365267e9795FC1fe34b31cB0b0112d5667e8F',   // Test Token A for testing
    },

    // BUSD per ticket
    VIP_PRESALE_INPUT_RATE : {
        1: 5,
        4: 5,
        56: 5,
        97: 5,
    },

    // HELIX per ticket
    VIP_PRESALE_OUTPUT_RATE : {
        1: 400,
        4: 400,
        56: 400,
        97: 400,
    },

    // Treasury address that receives input token (BUSD) purchases
    VIP_PRESALE_TREASURY: {
        1: '',
        4: '',
    },

    // Length of time in seconds between purchase phases
    VIP_PRESALE_PURCHASE_PHASE_DURATION: {
        1: 86400,
        4: 300,
        56: 86400,      // 1 day (86400 seconds)
        97: 300,        // 5 minutes
    },

    // Length of time between withdraw phases
    VIP_PRESALE_WITHDRAW_PHASE_DURATION: {
        1: 7862400,
        4: 300,
        56: 7862400,    // 91 days (86400 seconds per day * 91 days)
        97: 300,        // 5 minutes
    },

    // Amount of OUTPUT TOKEN to fund VIP Presale contract with
    // don't forget to multiply by 1e18
    VIP_PRESALE_INITIAL_BALANCE : {
        1: 20000000,
        4: 20000000,
        56: 20000000,       // 20,000,000
        97: 20000000,       // 20,000,000
    },

    // --------- Public Presale --------- //

    // Input token address
    PUBLIC_PRESALE_INPUT_TOKEN: {
        1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on mainnet
        4: '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b', // USDC on Rinkeby
    },

    // Output token address
    PUBLIC_PRESALE_OUTPUT_TOKEN: {
        1: '0x231CC03E6d8b7368eC2aBfAfb5f73D216c8af980', // HELIX on mainnet
        4: '0x79DD2dad8D04F9279F94580DBEd2306A0aE118Bd', // rinkeby HELIX
    },

    // Treasury address - address that receives INPUT token payments
    PUBLIC_PRESALE_TREASURY: {
        1: '0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7', 
        4: '0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57',
    },

    // USDC per ticket
    PUBLIC_PRESALE_INPUT_RATE : {
        1: 25,
        3: 25,
        4: 25,
    },

    // HELIX per ticket
    PUBLIC_PRESALE_OUTPUT_RATE : {
        1: 1000,
        3: 1000,
        4: 1000,
    },

    // Length of time between purchase phases (in seconds)
    PUBLIC_PRESALE_PURCHASE_PHASE_DURATION: {
        1: 1800,
        3: 300,
        4: 300,
    },

    // Amount of HELIX to fund Public Presale contract with
    // don't forget to multiply by 1e18
    PUBLIC_PRESALE_INITIAL_BALANCE : {
        1: 2000000,
        4: 2000000,
    },

    // --------- Airdrop Presale --------- //

    // contract name
    AIRDROP_NAME: {
        1: '',
        4: '',
        56: '',
        97: 'HODL AIRDROP'
    },

    // token address
    AIRDROP_TOKEN: {
        1: '',
        4: '',
        56: '', // Expect HELIX for mainnet
        97: '0xfa120708E905A870212B3DCd0079EC6084F5aC3E',   // Test Token B for testing
    },

    // Amount of HELIX to fund AirDrop contract with
    // don't forget to multiply by 1e18
    AIRDROP_INITIAL_BALANCE : {
        1: 125000000,
        4: 125000000,
        56: 125000000,       // 125,000,000
        97: 125000000,       // 125,000,000
    },

    // Length of time between withdraw phases
    AIRDROP_WITHDRAW_PHASE_DURATION: {
        1: 0,
        3: 7862400,
        4: 7862400,
        56: 0,
        97: 7862400,     // 91 days, 86400 == 1 day
    },
}
