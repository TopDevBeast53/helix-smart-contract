module.exports = {
    FACTORY_INIT_CODE_HASH: {
        1: '',
        4: '0xc28107fd87760cfb4e1668f5cb7a07b1049eaedf62697db36fb894567a372da6',
    },
    
    // --------- FeeHandler --------- //

    FEEHANDLER_NFTCHEF_PERCENT:{
        1: 0,
        4: 50,
    },

    // --------- Referral Register --------- //

    REFERRAL_STAKE_REWARD_PERCENT: {
        1: 0,
        4: 5,
        56: 5, // 5%
        97: 5, // 5%
    },
    REFERRAL_SWAP_REWARD_PERCENT: {
        1: 0,
        4: 5,
        56: 5, // 5%
        97: 5, // 5%
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
    MASTERCHEF_STAKING_PERCENT : {
        1: 714000,
        4: 714000,
    },
    MASTERCHEF_DEV_PERCENT : {
        1: 286000,
        4: 286000,
    },
    MASTERCHEF_LPTOKEN_ADDRESSES: {
        //HELIX-WETH, DAI-USDC, USDC-WETH, DAI-WETH, USDT-USDC
        4: ['0x50687BB28cf31E574F15E5d33Cde669a2cE07a52',
            '0x308C01C493196178214Ec8067CFFaf12c9A511Cc',
            '0x10B7B59d8b26fE3D0C30193F107F937fe48A4c47',
            '0x75b9427E98E773dF3D88bc0AFa1b3C2cb440eAB1',
            '0xCB238327b804f59Ea6b915Cc116B54AB4C9F993d']
    },
    MASTERCHEF_ALLOC_POINTS:{
        //HELIX-WETH, DAI-USDC, USDC-WETH, DAI-WETH, USDT-USDC
        4: [3500, 1500, 1500, 1500, 1500]
    },

    // --------- Helix Vault --------- //
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
        4: 25,
    },

    // HELIX per ticket
    PUBLIC_PRESALE_OUTPUT_RATE : {
        1: 1000,
        4: 1000,
    },

    // Length of time between purchase phases (in seconds)
    PUBLIC_PRESALE_PURCHASE_PHASE_DURATION: {
        1: 1800,
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
}
