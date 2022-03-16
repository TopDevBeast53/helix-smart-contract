module.exports = {
    FACTORY_INIT_CODE_HASH: {
        56: '',
        97: 'b3dbf286144465b5d1277ceebe58335c2fe959c90165316a4879ff9043c3fe52',
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
    MASTERCHEF_AURA_TOKEN_REWARD_PER_BLOCK : {
        56: '40000000000000000000', // 40 * 10e18 -> 40 aura tokens per block 
        97: '40000000000000000000', // 40 * 10e18 -> 40 aura tokens per block 
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
        97: '1000000000000000000', // currently this value means 1 AURA per block
    },
    
    // --------- Aura NFT & Chef --------- //

    NFT_INITIAL_AURAPOINTS : {
        56: '1000000000000000000', 
        97: '1000000000000000000', // currently this value means 1 AURAPOINTS
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
        97: '1000000000000000000', // currently this value means 1 AURA per block
    },

    // --------- Swap Rewards  --------- //

    SPLIT_REWARD_PERCENT : {
        56: 500,        // 50% Aura and 50% Ap
        97: 500,        // 50% Aura and 50% Ap
    },
    AURA_REWARD_PERCENT : {
        56: 50,         // 5% Aura Rewards
        97: 50,         // 5% Aura Rewards
    },
    AP_REWARD_PERCENT : {
        56: 50,         // 5% Ap Rewards
        97: 50,         // 5% Ap Rewards
    },
}
