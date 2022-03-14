module.exports = {
    FACTORY_INIT_CODE_HASH: {
        'main': '',
        'test': 'b3dbf286144465b5d1277ceebe58335c2fe959c90165316a4879ff9043c3fe52',
    },
    ORACLE_WINDOW_SIZE : {
        'main': 48,
        'test': 48,
    },
    ORACLE_GRANULARITY : {
        'main': 24,
        'test': 24,
    },

    // --------- Referral Register --------- //

    REFERRAL_STAKING_FEE_PERCENT : {
        'main': 30, // 3%
        'test': 30, // 3%
    },
    REFERRAL_SWAP_FEE_PERCENT : {
        'main': 50, // 5%
        'test': 50, // 5%
    },
    
    // --------- MasterChef --------- //

    MASTERCHEF_START_BLOCK : {
        'main': 0,
        'test': 0,
    },
    MASTERCHEF_AURA_TOKEN_REWARD_PER_BLOCK : {
        'main': '40000000000000000000', // 40 * 10e18 -> 40 aura tokens per block 
        'test': '40000000000000000000', // 40 * 10e18 -> 40 aura tokens per block 
    },
    MASTERCHEF_STAKING_PERCENT : {
        'main': 999000, // -> 99.9% of all farm rewards will go the users
        'test': 999000, // -> 99.9% of all farm rewards will go the users
    },
    MASTERCHEF_DEV_PERCENT : {
        'main': 1000, // -> 0.1% of all farm rewards will go to dev address
        'test': 1000, // -> 0.1% of all farm rewards will go to dev address
    },
    
    // --------- SmartChef --------- //

    //block when users can deposit their money into this pool and get rewards
    SMARTCHEF_START_BLOCK : {
        'main': 1,
        'test': 1,
    },
    //block when rewards are no longer being given away
    SMARTCHEF_END_BLOCK : {
        'main': 1000000000,
        'test': 1000000000,
    },
    SMARTCHEF_REWARD_PER_BLOCK : {
        'main': '1000000000000000000', 
        'test': '1000000000000000000', // currently this value means 1 AURA per block
    },
    
    // --------- Aura NFT & Chef --------- //

    NFT_INITIAL_AURAPOINTS : {
        'main': '1000000000000000000', 
        'test': '1000000000000000000', // currently this value means 1 AURAPOINTS
    },
    NFT_LEVEL_UP_PERCENT : {
        'main': 10,
        'test': 10,
    },
    NFTCHEF_START_BLOCK : {
        'main': 0, 
        'test': 0,
    },
    //Reward will calculate from this blocknum
    NFTCHEF_LAST_REWARD_BLOCK : {
        'main': 0, 
        'test': 0,
    },
    NFTCHEF_REWARD_PER_BLOCK : {
        'main': '1000000000000000000', 
        'test': '1000000000000000000', // currently this value means 1 AURA per block
    },

    // --------- Swap Rewards  --------- //

    SPLIT_REWARD_PERCENT : {
        'main': 500,        // 50% Aura and 50% Ap
        'test': 500,        // 50% Aura and 50% Ap
    },
    AURA_REWARD_PERCENT : {
        'main': 50,         // 5% Aura Rewards
        'test': 50,         // 5% Aura Rewards
    },
    AP_REWARD_PERCENT : {
        'main': 50,         // 5% Ap Rewards
        'test': 50,         // 5% Ap Rewards
    },
}
