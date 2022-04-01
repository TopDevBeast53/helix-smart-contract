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

    // Amount of HELIX to fund VIP Presale contract with
    VIP_PRESALE_INITIAL_BALANCE : {
        56: 20000000,       // 20,000,000
        97: 20000000,       // 20,000,000
    },

    // --------- Public Presale --------- //

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

    // Amount of HELIX to fund Public Presale contract with
    PUBLIC_PRESALE_INITIAL_BALANCE : {
        56: 105000000,       // 105,000,000
        97: 100000000,       // 100,000,000, using this value so that 100,000,000 % 20,000 == 0
    },
}
