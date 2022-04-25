module.exports = {
    FACTORY_INIT_CODE_HASH: {
        56: '',
        97: '0x24ce5e178671eef345936666e8eb1ff37156f2ab16ecb3e221d31da686fb2dbc',
    },
    ORACLE_WINDOW_SIZE : {
        56: 48,
        97: 48,
    },
    ORACLE_GRANULARITY : {
        56: 24,
        97: 24,
    },

    // --------- Referral Register --------- //

    REFERRAL_STAKING_FEE_PERCENT : {
        56: 30, // 3%
        97: 30, // 3%
    },
    REFERRAL_SWAP_FEE_PERCENT : {
        56: 50, // 5%
        97: 50, // 5%
    },
    
    // --------- MasterChef --------- //

    MASTERCHEF_START_BLOCK : {
        56: 0,
        97: 0,
    },
    MASTERCHEF_HELIX_TOKEN_REWARD_PER_BLOCK : {
        56: '40000000000000000000', // 40 * 10e18 -> 40 helix tokens per block 
        97: '40000000000000000000', // 40 * 10e18 -> 40 helix tokens per block 
    },
    MASTERCHEF_STAKING_PERCENT : {
        56: 999000, // -> 99.9% of all farm rewards will go the users
        97: 999000, // -> 99.9% of all farm rewards will go the users
    },
    MASTERCHEF_DEV_PERCENT : {
        56: 1000, // -> 0.1% of all farm rewards will go to dev address
        97: 1000, // -> 0.1% of all farm rewards will go to dev address
    },
    
    // --------- SmartChef --------- //

    //block when users can deposit their money into this pool and get rewards
    SMARTCHEF_START_BLOCK : {
        56: 1,
        97: 1,
    },
    //block when rewards are no longer being given away
    SMARTCHEF_END_BLOCK : {
        56: 1000000000,
        97: 1000000000,
    },
    SMARTCHEF_REWARD_PER_BLOCK : {
        56: '1000000000000000000', 
        97: '1000000000000000000', // currently this value means 1 HELIX per block
    },
    
    // --------- Helix NFT & Chef --------- //

    NFT_INITIAL_HELIXPOINTS : {
        56: '1000000000000000000', 
        97: '1000000000000000000', // currently this value means 1 HELIXPOINTS
    },
    NFT_LEVEL_UP_PERCENT : {
        56: 10,
        97: 10,
    },
    NFTCHEF_START_BLOCK : {
        56: 0, 
        97: 0,
    },
    //Reward will calculate from this blocknum
    NFTCHEF_LAST_REWARD_BLOCK : {
        56: 0, 
        97: 0,
    },
    NFTCHEF_REWARD_PER_BLOCK : {
        56: '1000000000000000000', 
        97: '1000000000000000000', // currently this value means 1 HELIX per block
    },

    // --------- Swap Rewards  --------- //

    SPLIT_REWARD_PERCENT : {
        56: 500,        // 50% Helix and 50% Hp
        97: 500,        // 50% Helix and 50% Hp
    },
    HELIX_REWARD_PERCENT : {
        56: 50,         // 5% Helix Rewards
        97: 50,         // 5% Helix Rewards
    },
    HP_REWARD_PERCENT : {
        56: 50,         // 5% HP Rewards
        97: 50,         // 5% HP Rewards
    },

    // --------- Helix Vault --------- //

    HELIX_VAULT_REWARD_PER_BLOCK: {
        56: '1000000000000000000', 
        97: '1000000000000000000', // currently this value means 1 HELIX per block
    },

    HELIX_VAULT_START_BLOCK : {
        56: 0, 
        97: 0,
    },

    //block when rewards are no longer being given away
    HELIX_VAULT_BONUS_END_BLOCK : {
        56: 1000000000,
        97: 1000000000,
    },

    // --------- VIP Presale --------- //

    // Input token address
    VIP_PRESALE_INPUT_TOKEN: {
        56: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',   // BUSD https://bscscan.com/address/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        97: '0xa34365267e9795FC1fe34b31cB0b0112d5667e8F',   // Test Token A for testing
    },

    // BUSD per ticket
    VIP_PRESALE_INPUT_RATE : {
        56: 5,
        97: 5,
    },

    // HELIX per ticket
    VIP_PRESALE_OUTPUT_RATE : {
        56: 400,
        97: 400,
    },

    // Treasury address that receives input token (BUSD) purchases
    VIP_PRESALE_TREASURY: {
        56: '0x0C7AB1234357c1D46F00F653f703E354A5C2a714',
        97: '0x59201fb8cb2D61118B280c8542127331DD141654',     // Deployer address for testing
    },

    // Length of time in seconds between purchase phases
    VIP_PRESALE_PURCHASE_PHASE_DURATION: {
        56: 86400,      // 1 day (86400 seconds)
        97: 300,        // 5 minutes
    },

    // Length of time between withdraw phases
    VIP_PRESALE_WITHDRAW_PHASE_DURATION: {
        56: 7862400,    // 91 days (86400 seconds per day * 91 days)
        97: 300,        // 5 minutes
    },

    // Amount of OUTPUT TOKEN to fund VIP Presale contract with
    // don't forget to multiply by 1e18
    VIP_PRESALE_INITIAL_BALANCE : {
        56: 20000000,       // 20,000,000
        97: 20000000,       // 20,000,000
    },

    // --------- Public Presale --------- //

    // Input token address
    PUBLIC_PRESALE_INPUT_TOKEN: {
        56: '', // Expect BUSD for mainnet
        97: '0xBe5D153b1A9e82E35d1e5f4Da8805E088c344482',   // Test Token A for testing
    },

    // Output token address
    PUBLIC_PRESALE_OUTPUT_TOKEN: {
        56: '', // Expect HELIX for mainnet
        97: '0xfa120708E905A870212B3DCd0079EC6084F5aC3E',   // Test Token B for testing
    },

    // Treasury address
    PUBLIC_PRESALE_TREASURY: {
        56: '',
        97: '0x59201fb8cb2D61118B280c8542127331DD141654',     // Deployer address for testing
    },

    // BUSD per ticket
    PUBLIC_PRESALE_INPUT_RATE : {
        56: 100,
        97: 100,
    },

    // HELIX per ticket
    PUBLIC_PRESALE_OUTPUT_RATE : {
        56: 5000,
        97: 5000,
    },

    // Length of time between purchase phases
    PUBLIC_PRESALE_PURCHASE_PHASE_DURATION: {
        56: 0,
        97: 1800,     // 30 minutes, 86400 == 1 day
    },

    // Amount of HELIX to fund Public Presale contract with
    // don't forget to multiply by 1e18
    PUBLIC_PRESALE_INITIAL_BALANCE : {
        56: 105000000,       // 105,000,000
        97: 105000000,       // 105,000,000
    },

    // --------- Airdrop Presale --------- //

    // contract name
    AIRDROP_NAME: {
        56: '',
        97: 'HODL AIRDROP'
    },

    // token address
    AIRDROP_TOKEN: {
        56: '', // Expect HELIX for mainnet
        97: '0xfa120708E905A870212B3DCd0079EC6084F5aC3E',   // Test Token B for testing
    },

    // Amount of HELIX to fund AirDrop contract with
    // don't forget to multiply by 1e18
    AIRDROP_INITIAL_BALANCE : {
        56: 125000000,       // 125,000,000
        97: 125000000,       // 125,000,000
    },

    // Length of time between withdraw phases
    AIRDROP_WITHDRAW_PHASE_DURATION: {
        56: 0,
        97: 7862400,     // 91 days, 86400 == 1 day
    },

    // --------- Airdrop Presale --------- //

    // contract name
    YIELD_SWAP_TREASURY: {
        56: '',
        97: '0x59201fb8cb2D61118B280c8542127331DD141654',
    },

    YIELD_SWAP_MIN_LOCK_DURATION: {
        56: 0,
        97: 604800,         // 1 week in seconds: (86400 seconds per day) * (7 days)
    },

    YIELD_SWAP_MAX_LOCK_DURATION: {
        56: 0,
        97: 31536000,       // 1 year in seconds: (86400 seconds per day) * (365 days)
    },
}
