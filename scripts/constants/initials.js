module.exports = {
    FACTORY_INIT_CODE_HASH: {
        'main': '',
        'test': '0x1edfe905a27b4e4e3c6ebe7eb40799334d5f79615b6a4c9d4a5a9f1e01516a05',
    },
    ORACLE_WINDOW_SIZE : {
        'main': 48,
        'test': 48,
    },
    ORACLE_GRANULARITY : {
        'main': 24,
        'test': 24,
    },
    REFERRAL_STAKING_FEE_PERCENT : {
        'main': 30, // 3%
        'test': 30, // 3%
    },
    REFERRAL_SWAP_FEE_PERCENT : {
        'main': 50, // 5%
        'test': 50, // 5%
    },
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
}