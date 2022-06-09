module.exports = {
    FACTORY_INIT_CODE_HASH: {
        1: '',
        4: '0x4bf92398ca4e6d769e05b577c12e3ca0a8125ef817cb0afec3df5708ba9fa0f8',
    },
    
    // --------- FeeHandler --------- //

    FEEHANDLER_NFTCHEF_PERCENT:{
        1: 0,
        4: 50,
    },

    // --------- Referral Register --------- //

    REFERRAL_STAKE_REWARD_PERCENT: {
        1: 0,
        4: 3,
        56: 3, // 3%
        97: 3, // 3%
    },
    REFERRAL_SWAP_REWARD_PERCENT: {
        1: 0,
        4: 5,
        56: 5, // 5%
        97: 5, // 5%
    },
    REFERRAL_TO_MINT_PER_BLOCK : {
        1: '4760000000000000000',
        4: '4760000000000000000',     // 4.76 * 10e18 -> 4.76 helix tokens per block
        56: '4760000000000000000',    // 4.76
        97: '4760000000000000000',    // 4.76
    },
    REFERRAL_LAST_MINT_BLOCK: {
        1: 0,
        4: 0,
    },
    REFERRAL_COLLECTOR_PERCENT: {
        1: 0,
        4: 10,
    },

    // --------- MasterChef --------- //

    MASTERCHEF_START_BLOCK : {
        1: 0,
        4: 0,
        56: 0,
        97: 0,
    },
    MASTERCHEF_HELIX_TOKEN_REWARD_PER_BLOCK : {
        1: '81900000000000000000',
        4: '81900000000000000000',   
        56: '81900000000000000000', // 81.9 * 10e18 -> 81.9 helix tokens per block 
        97: '81900000000000000000', // 81.9 * 10e18 -> 81.9 helix tokens per block 
    },
    MASTERCHEF_STAKING_PERCENT : {
        1: 675000,
        4: 675000,
        56: 675000, // -> 67.5% of all farm rewards will go the users
        97: 675000, // -> 67.5% of all farm rewards will go the users
    },
    MASTERCHEF_DEV_PERCENT : {
        1: 325000,
        4: 325000,
        56: 325000, // -> 32.5% of all farm rewards will go to dev address
        97: 325000, // -> 32.5% of all farm rewards will go to dev address
    },
    
    // --------- Helix Vault --------- //

    HELIX_VAULT_REWARD_PER_BLOCK: {
        1: '',
        4: '11700000000000000000',
        56: '11700000000000000000', 
        97: '11700000000000000000', // 11.7 * 10^18 -> helix tokens per block
    },

    HELIX_VAULT_START_BLOCK : {
        1: 0,
        4: 0,
        56: 0, 
        97: 0,
    },

    //block when rewards are no longer being given away
    HELIX_VAULT_LAST_REWARD_BLOCK : {
        1: 1000000000,
        4: 1000000000,
        56: 1000000000,
        97: 1000000000,
    },

    HELIX_VAULT_COLLECTOR_PERCENT: {
        1: 0,
        4: 10,
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
        1: '',
        4: '',
        56: '', // Expect BUSD for mainnet
        97: '0xBe5D153b1A9e82E35d1e5f4Da8805E088c344482',   // Test Token A for testing
    },

    // Output token address
    PUBLIC_PRESALE_OUTPUT_TOKEN: {
        1: '',
        4: '',
        56: '', // Expect HELIX for mainnet
        97: '0xfa120708E905A870212B3DCd0079EC6084F5aC3E',   // Test Token B for testing
    },

    // Treasury address
    PUBLIC_PRESALE_TREASURY: {
        1: '',
        4: '',
    },

    // BUSD per ticket
    PUBLIC_PRESALE_INPUT_RATE : {
        1: 100,
        4: 100,
        56: 100,
        97: 100,
    },

    // HELIX per ticket
    PUBLIC_PRESALE_OUTPUT_RATE : {
        1: 5000,
        4: 5000,
        56: 5000,
        97: 5000,
    },

    // Length of time between purchase phases
    PUBLIC_PRESALE_PURCHASE_PHASE_DURATION: {
        1: 0,
        4: 1800,
        56: 0,
        97: 1800,     // 30 minutes, 86400 == 1 day
    },

    // Amount of HELIX to fund Public Presale contract with
    // don't forget to multiply by 1e18
    PUBLIC_PRESALE_INITIAL_BALANCE : {
        1: 105000000,
        4: 105000000,
        56: 105000000,       // 105,000,000
        97: 105000000,       // 105,000,000
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
        4: 7862400,
        56: 0,
        97: 7862400,     // 91 days, 86400 == 1 day
    },

    // --------- Fee Minter --------- //
    
    // Represents the sum of desired to mint per block rates * 10^18
    // To mint per block rates:
    // Chef:        81.90   (Stake: 58.50 + Dev Team: 23.40)
    // Referral :    4.68
    // Vault:       11.70
    // Sum:         98.28
    FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK: {
        4: '98280000000000000000'
    },

    // Represents the percents of the to mint per block rate to delegate to each task
    // Percents to each task with 2 decimals of precision
    // Chef:        83.33%     (Stake: 59.52% + Dev Team: 23.81%)
    // Referral:     4.76%
    // Vault:       11.91%
    // Sum:        100.00%
    FEE_MINTER_TO_MINT_PERCENTS: {
        4: [8333, 476, 1191]
    },

    /// [MasterChef, ReferralRegister, HelixVault]
    FEE_MINTER_MINTERS: {
        4: ['0x15B400a434E0d94e0F1e1A0AA4a08E98A2d04128', '0x0f493190F225dC6700aac67E4402748b433629c9', '0x370650b477D550E4611CCe63eE8b7eCa64F207C0']
    },
}
