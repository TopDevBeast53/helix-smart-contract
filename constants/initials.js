
const env = require("./env")
const contracts = require("./contracts")

module.exports = {
    FACTORY_INIT_CODE_HASH: {
        1: 'df06dacc3c0f420f3e881baed6af2087e5ab8bc910d926f439c1081ec11fc885',
        4: '368552104b0dcaacb939b1fe4370f68e358d806ee5d5c9a95193874dd004841a',
        30: '039a6c55d612c34347963d19ff309e53bd5cd2c46f88b67b0f7f65d43193e92b',
        31: '039a6c55d612c34347963d19ff309e53bd5cd2c46f88b67b0f7f65d43193e92b',
        56: '039a6c55d612c34347963d19ff309e53bd5cd2c46f88b67b0f7f65d43193e92b',
        66: '039a6c55d612c34347963d19ff309e53bd5cd2c46f88b67b0f7f65d43193e92b',
        97: '039a6c55d612c34347963d19ff309e53bd5cd2c46f88b67b0f7f65d43193e92b',
    },
    
    // --------- FeeHandler --------- //

    FEE_HANDLER_DEFAULT_NFT_CHEF_PERCENT:{
        1: 33,      // 33%
        3: 33,
        4: 33,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },

    FEE_HANDLER_HELIX_VAULT_NFT_CHEF_PERCENT: {
        1: 33,      // 33%
        3: 33,
        4: 33,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },

    FEE_HANDLER_REFERRAL_REGISTER_NFT_CHEF_PERCENT: {
        1: 50,      // 50%
        3: 50,
        4: 50,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },

    FEE_HANDLER_LP_SWAP_NFT_CHEF_PERCENT: {
        1: 33,      // 33%
        3: 33,
        4: 33,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },

    FEE_HANDLER_YIELD_SWAP_NFT_CHEF_PERCENT: {
        1: 33,      // 33%
        3: 33,
        4: 33,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },

    // --------- Referral Register --------- //

    REFERRAL_STAKE_REWARD_PERCENT: {
        1: 5, // 5%
        3: 5,
        4: 5,
        30: 0,
        31: 5,
        56: 0,
        66: 0,
        97: 0,
    },
    REFERRAL_SWAP_REWARD_PERCENT: {
        1: 5, // 5%
        3: 5,
        4: 5,
        30: 0,
        31: 5,
        56: 0,
        66: 0,
        97: 0,
    },
    REFERRAL_LAST_MINT_BLOCK: {
        1: 0, // if 0, will be set with block.number when deploy
        3: 0,
        4: 0,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },
    REFERRAL_COLLECTOR_PERCENT: {
        1: 1000, // 10.00%
        3: 1000, 
        4: 1000,
        30: 1000,
        31: 1000,
        56: 1000,
        66: 1000,
        97: 1000,
    },

    // --------- MasterChef --------- //

    MASTERCHEF_START_BLOCK : {
        1: 0, // if 0, will be set with block.number when deploy
        3: 0,
        4: 0,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },
    MASTERCHEF_STAKING_PERCENT : {
        1: 600000,
        3: 714000,
        4: 714000,
        30: 600000,
        31: 714000,
        56: 600000,
        66: 600000,
        97: 600000,
    },
    MASTERCHEF_DEV_PERCENT : {
        1: 400000,
        3: 286000,
        4: 286000,
        30: 400000,
        31: 286000,
        56: 400000,
        66: 400000,
        97: 400000,
    },
    MASTERCHEF_LPTOKEN_ADDRESSES: {
        //HELIX-WETH, DAI-USDC, USDC-WETH, DAI-WETH, USDT-USDC
        1: [
                '0x74e3203F7C1008885970703A96e01feA0e5a511F',
                '0xf52F8F9C1202bb52A6BcA425BCDDbf7C1c85f7c6',
                '0x2D16c556E13daa5a11140E8EB520255aFe71b3ef',
                '0xBAfB64dEf8b0EfD1904c7c9e485fcae1993996cB',
                '0x906e53cC1790578732605C0Cf16DbED1EFaff21e'
            ],
        3: [
                '0x674f337EacE3Cb33907daAdA40Ba081326f19022',
                '0xDF7E7d20eF68Dc304f0C446def7E2eaB4A877fdD',
                '0xA8bBC7bF44FBFA4218654676095bA6af9A15877B',
                '0x84F1889112009AA2418AEa8FC66c1e45eFb3Adc9',
                '0x971a6BbC05fCdDbA1dD65dCE9B247831fc167bEf'
            ],
        4: [
                '0x4d762164f26DbfD16634fe933D1f6C7f72f08531',
                '0xB761cAb861Ba423239E852b7d628c5a14A6fb474',
                '0x8354fA5b6941b2ca5aD014aB56E69646bf4292F5',
                '0xaE25d607bB327A7353dbbbdFFc234Cbd3a0E9b29',
                '0xd87e648ccca6C944FA1A0aACDb4d0577518323f3'
            ],
        30: [
                '0x81b255Faa5828ed50E1B00F4d3b815A5085a1dAE',   // helix-wrbtc
                '0xeb882f7105fbfb21344460e67de46a24c5df8c1a',   // helix-rusdc
                '0xfe426a0f3d44f92cecef45d495185c3dd23f49d4',   // rusdt-wrbtc
                '0x0c80ccc24e21a8376d39924e4ec0dd1f54fda367',   // rif-wrbtc
                '0x57c3d1e11d79bb117997be1ab861f6d6768e7b63',   // sov-wrbtc
            ],
        31: [
                '0x792Ba36a0dF41141072A04C4485E393EC8dD7129',   // rhelix-wrbtc
                '0xb7190921ec3082d8227b02dC95A2d6f5b4AFCcDC',   // rhelix-rusdc
                '0x810b968858233e4F2873295D409f4E91998207CE',   // rusdc-wrbtc
                '0xa38B0DEB3d32673dC2CF4bE1B3af8233048A263E',   // rif-wrbtc
                '0x5863A6b17B8F2898B08c92ba2CBBAdfD8C588812',   // sov-wrbtc
            ],
        56: [
                '0xe3B4C21856153Ef65b8BfBaEb9ca18282c4535e7',   // helix-wbnb
                '0xbA4BF3A8aa1F566B29F7d13C6fE410D9A6F0cC61',   // helix-busd
                '0x4258bE0fD967DbFc6D19955828a27cB6D8Ba9344',   // busd-wbnb
                '0x53E5f05ee4fb500D0dc1f8c32b947952a1114be1',   // usdc-busd
                '0x47BF097Aa893c02C23c76774FbBDeb7AF693ce8a',   // usdt-busd
                '0x795839bdE85dadEeb38f9B988E34afF1F20dA063',   // usdc-usdt
                '0x6D6480E533455aF9112C47E8feD2b8810e78b29D',   // usdc-wbnb
                '0x45A83465940195AAD94fb0734D4AEc08A35C5bf0',   // cake-wbnb
        ],
        66: [],
        97: [],
    },
    MASTERCHEF_ALLOC_POINTS:{
        //HELIX-WETH, DAI-USDC, USDC-WETH, DAI-WETH, USDT-USDC
        1: [
                20000,  // pid 0
                12500,  // pid 1
                1000,  // pid 2
                2500,  // pid 3
                2500,  // pid 4
                1000,  // pid 5
                500,  // pid 6
                200,  // pid 7
                200,  // pid 8
                500,  // pid 9
                500,  // pid 10
                10000,  // pid 11
                1000,  // pid 12
                200,  // pid 13
                500,  // pid 14
                1000,  // pid 15
                500  // pid 16
        ],
        3: [3500, 1500, 1500, 1500, 1500],
        4: [3500, 1500, 1500, 1500, 1500],
        30: [
                1000,  // pid 0
                12500,  // pid 1
                10000,   // pid 2
                2500,  // pid 3
                5000,  // pid 4
                1250  // pid 5
            ],
        31: [
                3500,   // rhelix-wrbtc
                1500,   // rhelix-rusdc
                1500,   // rusdc-wrbtc
                1500,   // rif-wrbtc
                1500    // sov-wrbtc
            ],
        56: [
             20000, //HELIX pool
             12500, //HELIX-WBNB
             10000, //HELIX-BUSD
             2500, //BUSD-WBNB
             1000, //USDC-BUSD
             1000, //USDT-BUSD
             1000, //USDC-USDT
             2500, //USDC-WBNB
             500, //CAKE-WBNB
        ],
        66: [
            20000, // 0: helix:
            12500, // 1: helix-okt: 
            10000, // 2: helix-usdc: 
            2500, // 3: usdc-okt: 
            5000, // 4: usdt-usdc:
            1250, // 5: che-okt: 
        ],
        97: [],
    },

    // --------- Helix Vault --------- //
    HELIX_VAULT_START_BLOCK : {
        1: 0, // if 0, will be set with block.number when deploy
        3: 0,
        4: 0,
        30: 0,
        31: 0,
        56: 0,
        66: 0,
        97: 0,
    },

    //block when rewards are no longer being given away
    HELIX_VAULT_LAST_REWARD_BLOCK : {
        1: 1972243972, // June 30, 2032
        3: 1972243972,
        4: 1972243972,
        30: 1972243972,
        31: 1972243972,
        56: 1972243972,
        66: 1972243972,
        97: 1972243972,
    },

    HELIX_VAULT_COLLECTOR_PERCENT: {
        1: 150,     // 1.50%
        3: 1000,    // 10.00%
        4: 1000,
        30: 150,
        31: 1000,
        56: 150,
        66: 150,
        97: 1000,
    },

    // --------- Fee Minter --------- //
    
    // Represents the sum of desired to mint per block rates * 10^18
    // Farming Rewards: 62.5%
    // Vault Rewards: 9.375%
    // Referral Rewards: 3.125%
    // Team Emissions: 25%
    FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK: {
        1: '12000000000000000000',
        3: '10000000000000000000',
        4: '10000000000000000000',
        30: '15000000000000000000',
        31: '10000000000000000000',
        56: '450000000000000000',
        66: '0',
        97: '45000000000000000',
    },

    // Represents the percents of the to mint per block rate to delegate to each task
    // Percents to each task with 2 decimals of precision
    // Chef:        62.5%     (Stake: 37.5% + Dev Team: 25%)
    // Referral:     3.34%
    // Vault:       34.16%
    FEE_MINTER_TO_MINT_PERCENTS: {
        1: [6250, 334, 3416], // Ethereum
        3: [8750, 313, 937],
        4: [8750, 313, 937],
        30: [6250, 334, 3416], // RSK
        31: [8750, 313, 937],
        56: [6250, 334, 3416], // BSC
        66: [6250, 334, 3416], // OKC
        97: [6250, 334, 3416],
    },

    // --------- Treasury MultiSig --------- //
    
    TREASURY_MULTISIG_ADMINS: {
        1: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        3: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
        4: ['0x51606CAdD699fa80B8bFc3375103259e5ed7C195'],
        30: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        31: ['0x1f59f5ad0460f90881330678F1cFacE43d2F9cc8'],
        56: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        66: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        97: ['0x51606CAdD699fa80B8bFc3375103259e5ed7C195'],
    },

    TREASURY_MULTISIG_OWNERS: {
        1: ['0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c'],
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        30: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        31: ['0x22745897d49C1e15A562aa9F965aE087F2Fb89AA', '0xd4f46c6342229221d4EC3536627E9E76813f6071'],
        56: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        66: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        97: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
    },

    TREASURY_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
        30: 1,
        31: 1,
        56: 1,
        66: 1,
        97: 1,
    },

    TREASURY_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
        30: 2,
        31: 1,
        56: 2,
        66: 2,
        97: 1,
    },

    // --------- Owner MultiSig --------- //
    
    OWNER_MULTISIG_ADMINS: {
        1: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        3: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
        4: ['0x51606CAdD699fa80B8bFc3375103259e5ed7C195'],
        30: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        31: ['0x1f59f5ad0460f90881330678F1cFacE43d2F9cc8'],
        56: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        66: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        97: ['0x51606CAdD699fa80B8bFc3375103259e5ed7C195'],
    },

    OWNER_MULTISIG_OWNERS: {
        1: ['0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c'],
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        30: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        31: ['0x22745897d49C1e15A562aa9F965aE087F2Fb89AA', '0xd4f46c6342229221d4EC3536627E9E76813f6071'],
        56: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        66: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        97: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
    },

    OWNER_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
        30: 1,
        31: 1,
        56: 1,
        66: 1,
        97: 1,
    },

    OWNER_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
        30: 2,
        31: 1,
        56: 2,
        66: 2,
        97: 1,
    },

    // --------- Dev Team MultiSig --------- //
    
    DEV_TEAM_MULTISIG_ADMINS: {
        1: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        3: ['0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57'],
        4: ['0x51606CAdD699fa80B8bFc3375103259e5ed7C195'],
        30: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        31: ['0x1f59f5ad0460f90881330678F1cFacE43d2F9cc8'],
        56: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        66: ['0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7'],
        97: ['0x51606CAdD699fa80B8bFc3375103259e5ed7C195'],
    },

    DEV_TEAM_MULTISIG_OWNERS: {
        1: ['0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c'],
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        30: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        31: ['0x22745897d49C1e15A562aa9F965aE087F2Fb89AA', '0xd4f46c6342229221d4EC3536627E9E76813f6071'],
        56: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        66: [
                '0xccd291eD76EFeC9dde0cb3Ce148AaC59d7656bAe', 
                '0xe8736c8610AcbD753023ec367b8E020Ae1d2D17c',
                '0xfB8B9191A5eF78c4D91a74EcdFd9B10E30Bf716c',
                '0x609b0D5715728e844CD11d353cb56310B74a31Ca',
                '0x84e7286ecF7049CcFe9590e9d91b6361B10f8795',
            ],
        97: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
    },

    DEV_TEAM_MULTISIG_ADMIN_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
        30: 1,
        31: 1,
        56: 1,
        66: 1,
        97: 1,
    },

    DEV_TEAM_MULTISIG_OWNER_CONFIRMATIONS_REQUIRED: {
        1: 1,
        3: 1,
        4: 1,
        30: 2,
        31: 1,
        56: 2,
        66: 2,
        97: 1,
    },

    // --------- Timelock --------- //
    
    TIMELOCK_MIN_DELAY: {
        1: 21600,   // 6 hours 
        3: 21600,   // 6 hours 
        4: 0,  
        30: 21600,   // 6 hours 
        31: 120,   // 2 minutes
        56: 21600,   // 6 hours 
        66: 21600,   // 6 hours 
        97: 120,   // 2 minutes
    },

    TIMELOCK_EXECUTORS: {
        1: ['0x0000000000000000000000000000000000000000'],  // Anyone can propose - https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController
        3: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        4: ['0x8E655798f4D263B77CBc5791C1Eb8885e55e972d', '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'],
        30: ['0x0000000000000000000000000000000000000000'],  // Anyone can propose - https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController
        31: ['0x0000000000000000000000000000000000000000'],  // Anyone can propose - https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController
        56: ['0x0000000000000000000000000000000000000000'],  // Anyone can propose - https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController
        66: ['0x0000000000000000000000000000000000000000'],  // Anyone can propose - https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController
        97: ['0x0000000000000000000000000000000000000000'],  // Anyone can propose - https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController
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
        31: 50, 
    },

    // --------- Bridge --------- //

    BRIDGE_ADMIN_ADDRESS: {
        1: '0xB9aa17D9F114E35a0249Be020C2f10024b0D8705',
        3: '0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57', 
        4: '0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57', 
    },

    BRIDGE_FEE_ETH_AMOUNT: {
        1: '15000000000000000',
        3: '15000000000000000',
        4: '15000000000000000',
    },

    BRIDGE_LIMIT_WRAP: {
        1: 12,
        3: 12,
        4: 12,
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

    // token address
    AIRDROP_TOKEN: {
        1: '',
        4: '0x79DD2dad8D04F9279F94580DBEd2306A0aE118Bd',
        56: '0x67e02A2A1e7527eB18A703a19778f8ACd9972808', // HELIX-P
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
        4: 60,
        56: 7862400,
        97: 7862400,     // 91 days, 86400 == 1 day
    },

    // --------- Advisor Rewards --------- //

    // Length of time between withdraw phases
    ADVISOR_REWARDS_WITHDRAW_PHASE_DURATION: {
        1: 7862400,
        3: 120,
        4: 120,
    },

    // --------- Payment Splitter --------- //

    // Addresses to recieve funds when payment splitter receives funds
    // Error will be thrown if array is empty
    PAYMENT_SPLITTER_PAYEES: {
        1: [
            '0x3EC0F3e8b587E21dac6f776780A56F475C16A4b2',
            '0x1FDbAe6036D0bD2Daf267C809fC45C7Ab6Ec67BB',
            '0x8d3D07e15317efC76D31Dc12281A970B00bADBB7',
            '0x9BE663907af30984F3e18B8337742806237A6a5E',
            '0x6B399E1eEe3b97afBfD33e94900636AaFD1A001c',
            '0x36d68E8b6a46F1a4538AF4Ba29d91D78fD6A4182',
            '0xAAb2eACC08690BDbE4A11F43498cA0b9D37D16c2',
            '0x2A3c3b05bA102d9F0B3B2a635ba73e1996d488d0',
            '0xED2bcda237e32DC9183f58205C6054f83AD1F1e0',
            '0x616C5bA33E28659F7Dc5DF009Df85ff0BBb405Cb',
            '0x2Dbdce62Ef743c196E667B0ABAE988887c805Fc8',
            '0xE0141093451baC286b497cD6aef4952FA8AE6796',
            '0x969232E08b2F5Ac75E9e2ad4377D452819bb5d16',
            '0x433483e8BBcd31703bfbb265a587588177268cAb',
            '0x3D0ECf515E8F8E8784D4be6e8654388d8eb717a5',
            '0x73339C955c96bdfa1C2C9b9ca3d95429875Dd569',
            '0x64BED09E2a35711d1635CeDFB4330948cF36d851',
        ],
        4: [
            '0x59201fb8cb2D61118B280c8542127331DD141654',
            '0x51606cadd699fa80b8bfc3375103259e5ed7c195',
            '0xee936e648cD998e9df4531dF77EF2D2AECA5921b'
        ],   
        30: [
            '0x3EC0F3e8b587E21dac6f776780A56F475C16A4b2',
            '0x1FDbAe6036D0bD2Daf267C809fC45C7Ab6Ec67BB',
            '0x8d3D07e15317efC76D31Dc12281A970B00bADBB7',
            '0x9BE663907af30984F3e18B8337742806237A6a5E',
            '0x6B399E1eEe3b97afBfD33e94900636AaFD1A001c',
            '0x36d68E8b6a46F1a4538AF4Ba29d91D78fD6A4182',
            '0xAAb2eACC08690BDbE4A11F43498cA0b9D37D16c2',
            '0x2A3c3b05bA102d9F0B3B2a635ba73e1996d488d0',
            '0xED2bcda237e32DC9183f58205C6054f83AD1F1e0',
            '0x616C5bA33E28659F7Dc5DF009Df85ff0BBb405Cb',
            '0x2Dbdce62Ef743c196E667B0ABAE988887c805Fc8',
            '0xE0141093451baC286b497cD6aef4952FA8AE6796',
            '0x969232E08b2F5Ac75E9e2ad4377D452819bb5d16',
            '0x433483e8BBcd31703bfbb265a587588177268cAb',
        ],
        31:[
            '0x1f59f5ad0460f90881330678F1cFacE43d2F9cc8',
            '0x22745897d49C1e15A562aa9F965aE087F2Fb89AA',
            '0xd4f46c6342229221d4EC3536627E9E76813f6071',
        ],
        56: [
            '0x3EC0F3e8b587E21dac6f776780A56F475C16A4b2',
            '0x1FDbAe6036D0bD2Daf267C809fC45C7Ab6Ec67BB',
            '0x8d3D07e15317efC76D31Dc12281A970B00bADBB7',
            '0x9BE663907af30984F3e18B8337742806237A6a5E',
            '0x6B399E1eEe3b97afBfD33e94900636AaFD1A001c',
            '0x36d68E8b6a46F1a4538AF4Ba29d91D78fD6A4182',
            '0xAAb2eACC08690BDbE4A11F43498cA0b9D37D16c2',
            '0x2A3c3b05bA102d9F0B3B2a635ba73e1996d488d0',
            '0xED2bcda237e32DC9183f58205C6054f83AD1F1e0',
            '0x616C5bA33E28659F7Dc5DF009Df85ff0BBb405Cb',
            '0x2Dbdce62Ef743c196E667B0ABAE988887c805Fc8',
            '0xE0141093451baC286b497cD6aef4952FA8AE6796',
            '0x969232E08b2F5Ac75E9e2ad4377D452819bb5d16',
            '0x433483e8BBcd31703bfbb265a587588177268cAb',
            '0x3D0ECf515E8F8E8784D4be6e8654388d8eb717a5',
            '0x73339C955c96bdfa1C2C9b9ca3d95429875Dd569',
            '0x64BED09E2a35711d1635CeDFB4330948cF36d851',
        ],
        66: [
            '0x3EC0F3e8b587E21dac6f776780A56F475C16A4b2',
            '0x1FDbAe6036D0bD2Daf267C809fC45C7Ab6Ec67BB',
            '0x8d3D07e15317efC76D31Dc12281A970B00bADBB7',
            '0x9BE663907af30984F3e18B8337742806237A6a5E',
            '0x6B399E1eEe3b97afBfD33e94900636AaFD1A001c',
            '0x36d68E8b6a46F1a4538AF4Ba29d91D78fD6A4182',
            '0xAAb2eACC08690BDbE4A11F43498cA0b9D37D16c2',
            '0x2A3c3b05bA102d9F0B3B2a635ba73e1996d488d0',
            '0xED2bcda237e32DC9183f58205C6054f83AD1F1e0',
            '0x616C5bA33E28659F7Dc5DF009Df85ff0BBb405Cb',
            '0x2Dbdce62Ef743c196E667B0ABAE988887c805Fc8',
            '0xE0141093451baC286b497cD6aef4952FA8AE6796',
            '0x969232E08b2F5Ac75E9e2ad4377D452819bb5d16',
            '0x433483e8BBcd31703bfbb265a587588177268cAb',
        ],
        97:[
            '0x1f59f5ad0460f90881330678F1cFacE43d2F9cc8',
            '0x22745897d49C1e15A562aa9F965aE087F2Fb89AA',
            '0xd4f46c6342229221d4EC3536627E9E76813f6071',
        ],
    },

    // Amount of shares each payee receives
    // Error will be thrown if array is empty
    PAYMENT_SPLITTER_SHARES: {
        1: [
            10000, 
            2000, 
            2000, 
            2000, 
            225,
            450,
            150,
            300,
            150,
            300,
            300,
            625, 
            750,
            300,
            150,
            150,
            150,
        ],
        4: [
            5, 
            10,
            20
        ],
        30: [
            10000, 
            2000, 
            2000, 
            2000, 
            225,
            450,
            150,
            300,
            150,
            300,
            150,
            625, 
            1350,
            300,
        ],
        31: [
            5, 
            10,
            20
        ],
        56: [
            10000, 
            2000, 
            2000, 
            2000, 
            225,
            450,
            150,
            300,
            150,
            300,
            150,
            625, 
            900,
            300,
            150,
            150,
            150,
        ],
        66: [
            10000, 
            2000, 
            2000, 
            2000, 
            225,
            450,
            150,
            300,
            150,
            300,
            150,
            625, 
            1350,
            300,
        ],
        97: [
            5, 
            10,
            20
        ],
    },

    // --------- Airdrop Payment Splitter --------- //

    // Addresses to recieve funds when payment splitter receives funds
    // Error will be thrown if array is empty
    AIRDROP_PAYMENT_SPLITTER_PAYEES: {
        1: ['0x4F7eF9d21fc5E8B83d37386e5507c34bF87CFC90','0xBb6187fe3dCB8D99e1A5991b2a81F02D5e497bFb','0x7e0EA36c5bA39Da24e7B25E0F1819BB26c0DBcD1','0xE1836BC9EE4b4441e9E6824F70D9fa70E3Bbe84a','0x7D5140eF8ee09bc79F110d0b3e33FE66b337A30f','0x6a9E1E157f0E02b69A81B868F29b2D44468F161E','0xa39499489936C0b0aad84eEf76DbDB79Dd863bba','0x075E3E705dcF565A59798bf584f1521623A9B24c','0xEFc53997a1143f6EC7d56a1b9CB8A137442F2Fd1','0x616C5bA33E28659F7Dc5DF009Df85ff0BBb405Cb','0x07862Bde5dc512a6783020Dbd10094dc26F10073','0x221e438E4A8Fc6569457bAe62CbCcDb8b5b02a93','0x6B399E1eEe3b97afBfD33e94900636AaFD1A001c','0xCb884A23577B6fe4193a8775F1D0131aaC5c30d3','0xEC733cEE2C613b3BE783c712d8Fd8831eE53691C','0x7B5BF738f19CB5E8a2a787367516bbE71C8f42B3','0xE03E36F8687C5Ce98682c84E5aDAC6d37487Ddd3','0xA64f0d632C005C0E76276a4e4013b117F3934e61','0x73339C955c96bdfa1C2C9b9ca3d95429875Dd569','0x3D0ECf515E8F8E8784D4be6e8654388d8eb717a5','0x00ea890138fC0a6B06aF15b420353c3d12841dF7','0x4F9099d1C393bFB576f6E541E4BdC42d5050366f','0x9D06DCCb9f5D1C79Dce56003549815DC1F3cDAc2','0xCdC9Ee92c4DBe054b84ffea9757d47dc8A00E5f9','0xE7f83EE560526B468b72FB0C7A79Ee8Df94C9341','0xf08657918BBc119B9929Ee06c7CE8d8FfdE48FA4','0xe65130C719584A68D48e2968E79e19d5dAf1e983','0x64e4BC6401F96d678Cfed475F74ee9c33b1514bd','0x9de2b52bF7a17593B75450aEFCE337A2B6434444','0x022733ecC4FD9FE2b5525eBf3123BC4Ee9D1A80D','0x822d5a1AE66c55AF73e98B9A68313a7eDD8dfF67','0xE01B42995D6dCE9334D22B6cF9995c3fAE425FA6','0x7Fe28c576Bd821d495a08e244d11Cf33069b17C0','0x74846a0745d0BbFE97f93d6091B5d09763bE70B9','0x1D4c05EB659Fe28FF58ffe6CA672ACb6c55E86D2','0x279f48154D408D8f8b392923195E067E64018929','0xf50Fee3A8196e49bfb6501e86411936EcB03E952','0xB7EA6b741A0f0E4c2b21629C4157bd3Ece43d88C','0x433483e8BBcd31703bfbb265a587588177268cAb','0x5CD3D358426843abADDD6b0848De97b6C48a0801','0x95D04983ea58ded31d8AbfB823B5eaE864681bF7','0xd9873df817AE38dbeE1D2aF25d3c206E1F826F44','0x31aa2a65Df21BdD1C933e27CfF772fc16119ADFA','0xC2716B34012AD0Af006a908d41B8e2BC6a42EC24','0x71639c22bd39378b762309623590aa6fF1373c43','0xE146DFE9ca701d75FFFE47cA15249964396C36a8','0x6F5ee0A3Bb2B8BfAe3430d09216A6DeAebB81B7A','0xe2903eC8F0e117D0956F220933A5d9F4c7Cd312b','0xc066e3A0a4e824ca34D94338BbBc984ccbC781d2','0x239374fE72E1322aD44007A24C4217fab1FA39E0','0xD836f3778BAf489f78cc0efdd4E464505668A5c8','0xd35698a341C1F0862F65Bb0E00DFF0a592F5f728','0xCC8b0d940F3C450593b06e92e74C96b7908765f1','0x983268d0047121Af20a054Cdf91808fCc79D2396','0xD26C59651B5ED6F83673e9c14b86910A81A3ac23','0xc56f63451E6e123cEB5DA1019A07d53f194f5B48','0x36d68E8b6a46F1a4538AF4Ba29d91D78fD6A4182','0x5fD5942c70C433630DeD2866564cE6154b30DF1d','0x463aF3092D5E7A3150a69d3c80BcE6428C384d4e','0xcdFbFA3309fB7e8Bc604F27f42D906f8E62B7797','0xBdc2F13A3D4c1852568Fe95dA71A88a7253EDA51','0x0c5D1220b0dFaEd89707E11328d29b3202FfcD5e','0x34f763fEBE8B58c952b31bD53c376Fcd02DC8Bb8','0x1bbDa612525d0361a0C46fc001830a6E0dDb7eAa','0xA8e770D5976A2E54F9D5c3A16c41a1aACa0244D6','0xb7846A827E60756dAa7aef93De4E7D3926B35F04','0x64BED09E2a35711d1635CeDFB4330948cF36d851','0x5b30aC36951E5E89F12606B3AB65883c98051622','0x06cADC487479d39082d91e5FDc4D79a534fd960f','0xA92cd70cEA6D7D4b653a478DDeD8845362f04ecb','0x1090438FcaF18F8d632b2cEC525e8D22aCF8C10c','0xc84B9Eb01921843ea53C6314fBf7f4051A8Ee012','0x21b60c7a211365c9C662A6c96F00D9aCBB689431','0xd8148089D92E5579D5aD38Cf194f449893BA28C9','0x9C9E22B6d527a68279f8BdA25FdE4536341C3B8F','0x28608Fe38BAce2Ccbc7CD00D7188eB2fcf46720C','0x31BBA48CCE883e6E3a1819FdEEdedb175D6F028E','0x9557144de0EdaCD8b409Ca3b26965FF281129c1a','0x55CE30da603B3F3430C0A2782cE5E0aDE8318c84','0x9ca5FF1dA81f58e3BBEf308027489A76Ce51A3d8','0x7452faFF02a9678061220445Ad59c9E869baf2A9','0x1205942BD0e22f22099f51eccc0B799D9Eaf89f4','0xA68a00a7b74d0362cae1D6DBEA1797D8717dCc93','0x22fB43726E729dD87cE62C7549636730ca444050','0xFa265a98732Ad5267a1D9DB8da434aaBc4BA18c0','0x67c222D79349f4F1bE073b290ef4d486861da091','0xbEfF8217477165E49eb3cf5A6D72556E960A2B7F','0x44415C6431DbEDb2e71B08F7555cdfc588E7a151','0x11b2dB167E4Bd6d37AC327c6eA31BAB543D5f399','0x6590324dB19418308694855661D3ACfb60F40a4D','0x413Cb059a15f1De3FC236E432149918E46F4e6ed','0x4660Ab36ccD9c7F202888295C9B09C0411EC8b10','0xCfC852e4Dd47D6945698D9f998e6D77afC70825b','0x8c62482f04E5c4880ada47b0aaE7DB1f41A075f6','0x20f7F9b7C1AEF55106b9c4cF66fB316346B73B41','0xA3e2A974a9C64BA00A6baA7A30aAB6ebc6B79361','0x52644D60EAC051826Ae2a06948697a340bDF9219','0x83ebE573bFb90BBA32b474C3335Ca605b09A0bDD','0xED6e29b74f23886198222CdD11b550A15253eE91','0x121EC79e9Eb2540eB211797fa09052364A7d28C5','0xEFB1bBD484FB263157Ff831C0aA4E656948c4C82','0x6708dcC6D0Ae5f0EBf041bB6bD554e7B286CB3b3','0x9AF963583849b475B3A0ad7494DD0b7DC98C6CA3','0xaF41ECF2b33812D98Dd95BCbd535a96DB7f3f34C','0x36F3063183ca5345aFD6398178766f1967f682A0','0x3F09De61006749d249F39A6A271C2945D01F1d02','0xfBE6006A193560150F63902B7C8B69fa8739Bc95','0x41c2FBd5aDa023975d2c950bd4ECF93A6c2c97Ea','0x74984cf9640Faf8E4990701aEB04F732cE136E3c','0x353e98116a4FcA6b58902Cb583E560d2a024431D','0x863ab57e290e71AB618684991D4D2F569E798faD','0x8B883C6d8d675d833Ec74F226f34a608320D971a','0xE0568C693f34A40D02aEF14F6D10D4777722865B','0x5ab75956E646017a97391d62bD379821c6580475','0xcC7d830eD37b7dA4bcF6bCd4f2A09089DEF774B7','0xfEb06507E3749A49A9ea331A81037b78BB293305','0x41d83f790E9703B8fe43D9434aEc2cA259df18fF','0x2d4fFc4C47f994cf0d42e3C55cEb7502055821e8','0x857D165BE26B64a691eb225b6b1e4b64124e1a79','0xd50c6DE81DEdAbb67a92eE98ab342AF1032F324a','0xB9b40a1963720C0fc0a73aA279A04E0E940Eb6ff','0x95cF9511Bf739cBD2935f6B35515d9e11c9C5434','0xF3C3f536A70C09E7Eaf1E000809d5B6463c20573','0x1de45454DB147D32F827Ca8223Ac09C45B2753a0','0x65404Cf2d915703Df7Db23f1140e94f3e77fd9f2','0x3849058bb15Be2B674fFf357a38D3C53d4c21095','0x096A79F62Bd3D2b0F600C1733017d19Ed1B977B0','0x887a9f0873D48d9CdCFDc003A9cd8F4C6A4EB027','0x2F298e77bA4Fd4c0B6878938F6b4071927954086','0x0c442623B6B99C967d897077EA500E9aCddc8ab9','0xDb7015dfb194eEAA2018d1904AeC01EeA43ECd65','0x4fa268ff1EE3F33fcd14504E4e6377989341b7e2','0x6aA45342916483d3f015d363B6151f25dF735dD1','0x2112C519dcdC58b1bDa919F6f728c19a838Dd372','0x408C554D45e79cBfE1d671Ca6c3ea3a8FFE49B34','0x40CBD23A880fC32c607291BeC687697CaABD8803','0x5075F3b632EB8E16C4b14d04817701B7722eF786','0x7DC659Fe3CAC3d9dF1b24662fB9Ee5954cB6D308','0x6Bf5EE5390E49AE8C0Fa1E4aDa41B7e69d6C4c9B','0x810EcAc7a0f31dD0f32d68748a7242b1551E2496','0x9397D779c63FAAF7F2e4c358a35E58bf53CcCFa1','0x30Bb23A9b17D10F8a10386477254a1B67f31A82b','0x10Ea501CA01af7D91498987eA6340c7b51BAdDFF','0xbDE5935634469fb8090CFF5c891b5f99b4A679ED','0x671b7035a8a7c4072f14bD2C3060695d6b033484','0x39aAB27a82c66bDB1bca68B0DE71819833cA62A5','0xF8Fb5d7acB9eCd0B0050CbDd4c0a0647965F0DBF','0x4646Fd1a0153bA28B2A33433d811604c41ad6914','0xD5cd2C1D39c2f1162E8056e7a79e09c681674f27','0x11d5A07Cfcf40A445DF13C15f5c6D093c001ffBB','0x14720EE0555Ac02aac7cD59a0D72Caf56025ca97','0x3cf2dde4b15AF46aa18864Ce94725f9019283576','0xD3ad937516a7E19C3c9562462e3a9BEB554Be11E','0x2f2FD29Ca72D0550fd7C52c4a711dCe4fa731Eba','0x524d63FB924D0d7BbEB93b50a73d548bf388F04B','0xD9052b142CEa223d913b6b786AA707C4E6C195dC','0xe10a69711a1e7034303f7a191FD448e5B2F552bF','0xc64797e6caB5C08B68Bcd118e3A22761e582E241','0xfcEA932cE672b998D3D06eAF140a3Ef29336c30E','0xc6b094623AEef377974ad372B7a5D42a0faea524','0x5E7649920B4bc9681b77480361A4d850e3b83388','0x946211AA9a8e1dc8652752715163402Dcf24035C','0x09d6679f6913b32Ccf0CD3803e688a3a496452D7','0x40c7E9977d99fD3Db838FfB1E312AD9E2423c457','0x20f634dB547e9E64802F53E95565a82C0D26B031','0x961e3d246748d00dcfC0894783bC0C161861C22B','0xa1eA8228d2c3d0766E3817b22b7C2BE1aFaad2a2','0x4F7934A9576a78213f821708298FBE51beDfb9DB','0x4a20B67AC0519CF1677Da336eB300FA4132Af88e','0x987780A38342516068e0166aF603939E41b61a1C','0x104fcdbd268EB4091889d89E026be21e4b38868d','0x8D618e25F34a17da3809C6222f5CAFF1410129A5','0xB2069a5506b15B98284d2f249716d38FC5B9bbbD','0x1358a617CB1aa22513adB315dc33E58c8c046B93','0x8763E8C8faA98dC78f9Cc797570410976f178933','0x92B0d17889d5A36Bc63f756d04Ec369aC2614E36','0xb6518414C8eE49BEC909c9f7fA819b01C8929Ac0','0x6a5Adc59e769044B16314097e76EBE3F27794A5a','0xA6aD1cd1822668e2a3aC84608dD0dc3c80388339','0x010a041197306B8aE721C2af4a51c4DdB3874208','0x0ce476B12F4c31aD9702F7ca4b09fE08D8f7d434','0x7992aFd7D74e28BB0729a45b6723cA909f4BcEf1','0x99eCBAfb517fea2bd2A3c40dAEE6696E84951b70','0xbaD4dc6BC16b35A9376F403655048D9f20Fb47f5','0x433021eD1FCb241F3B0C5FD76e58c05ebB4F87EA','0xD04F8aB079F4f9e3e5B970a26a8678A126AaF283','0x22E3cD8dDE0506Cd61876A86b77c90d444E7317D','0x42cc45EB4eeF3ae9CD11341679DD3b75BfbbfBf5','0xcdA528D8dF68f9E44728248a4F4c0872207771bb','0x6B01259Eaea929717460eB1d20981288cc2a6f3E','0x9f96eD62205F88ebB352cdF46306b3d720C8eC0F','0x5ec7847e5284585a0af4dEC750626A5b38526de0','0x353E07F362E8315a3B4F00d67C67d5B489FA7880','0x9fBFd590FF177aB27AdD89b8f071870EFA0BB0E3','0x210f6a9E076Af8d46d25E523f02c52cFEEDE535e','0xa5B8E55841af8cE7ba26f5e8e6B9bE48dF021E20','0x33c68B77aF2c6A375F038Cbdb3D6eDa9aF7cB274','0x9dA577bE5727D7FeB03e3115DDa2e6893d301884','0x14358553c0318e3342769df2f5B7375152F6964E','0x8eDFcb711fDb02F495a22a7356b22B5E3B9FFC26'],
        4: ['0x4F7eF9d21fc5E8B83d37386e5507c34bF87CFC90','0xBb6187fe3dCB8D99e1A5991b2a81F02D5e497bFb','0x7e0EA36c5bA39Da24e7B25E0F1819BB26c0DBcD1','0xE1836BC9EE4b4441e9E6824F70D9fa70E3Bbe84a','0x7D5140eF8ee09bc79F110d0b3e33FE66b337A30f','0x6a9E1E157f0E02b69A81B868F29b2D44468F161E','0xa39499489936C0b0aad84eEf76DbDB79Dd863bba','0x075E3E705dcF565A59798bf584f1521623A9B24c','0xEFc53997a1143f6EC7d56a1b9CB8A137442F2Fd1','0x616C5bA33E28659F7Dc5DF009Df85ff0BBb405Cb','0x07862Bde5dc512a6783020Dbd10094dc26F10073','0x221e438E4A8Fc6569457bAe62CbCcDb8b5b02a93','0x6B399E1eEe3b97afBfD33e94900636AaFD1A001c','0xCb884A23577B6fe4193a8775F1D0131aaC5c30d3','0xEC733cEE2C613b3BE783c712d8Fd8831eE53691C','0x7B5BF738f19CB5E8a2a787367516bbE71C8f42B3','0xE03E36F8687C5Ce98682c84E5aDAC6d37487Ddd3','0xA64f0d632C005C0E76276a4e4013b117F3934e61','0x73339C955c96bdfa1C2C9b9ca3d95429875Dd569','0x3D0ECf515E8F8E8784D4be6e8654388d8eb717a5','0x00ea890138fC0a6B06aF15b420353c3d12841dF7','0x4F9099d1C393bFB576f6E541E4BdC42d5050366f','0x9D06DCCb9f5D1C79Dce56003549815DC1F3cDAc2','0xCdC9Ee92c4DBe054b84ffea9757d47dc8A00E5f9','0xE7f83EE560526B468b72FB0C7A79Ee8Df94C9341','0xf08657918BBc119B9929Ee06c7CE8d8FfdE48FA4','0xe65130C719584A68D48e2968E79e19d5dAf1e983','0x64e4BC6401F96d678Cfed475F74ee9c33b1514bd','0x9de2b52bF7a17593B75450aEFCE337A2B6434444','0x022733ecC4FD9FE2b5525eBf3123BC4Ee9D1A80D','0x822d5a1AE66c55AF73e98B9A68313a7eDD8dfF67','0xE01B42995D6dCE9334D22B6cF9995c3fAE425FA6','0x7Fe28c576Bd821d495a08e244d11Cf33069b17C0','0x74846a0745d0BbFE97f93d6091B5d09763bE70B9','0x1D4c05EB659Fe28FF58ffe6CA672ACb6c55E86D2','0x279f48154D408D8f8b392923195E067E64018929','0xf50Fee3A8196e49bfb6501e86411936EcB03E952','0xB7EA6b741A0f0E4c2b21629C4157bd3Ece43d88C','0x433483e8BBcd31703bfbb265a587588177268cAb','0x5CD3D358426843abADDD6b0848De97b6C48a0801','0x95D04983ea58ded31d8AbfB823B5eaE864681bF7','0xd9873df817AE38dbeE1D2aF25d3c206E1F826F44','0x31aa2a65Df21BdD1C933e27CfF772fc16119ADFA','0xC2716B34012AD0Af006a908d41B8e2BC6a42EC24','0x71639c22bd39378b762309623590aa6fF1373c43','0xE146DFE9ca701d75FFFE47cA15249964396C36a8','0x6F5ee0A3Bb2B8BfAe3430d09216A6DeAebB81B7A','0xe2903eC8F0e117D0956F220933A5d9F4c7Cd312b','0xc066e3A0a4e824ca34D94338BbBc984ccbC781d2','0x239374fE72E1322aD44007A24C4217fab1FA39E0','0xD836f3778BAf489f78cc0efdd4E464505668A5c8','0xd35698a341C1F0862F65Bb0E00DFF0a592F5f728','0xCC8b0d940F3C450593b06e92e74C96b7908765f1','0x983268d0047121Af20a054Cdf91808fCc79D2396','0xD26C59651B5ED6F83673e9c14b86910A81A3ac23','0xc56f63451E6e123cEB5DA1019A07d53f194f5B48','0x36d68E8b6a46F1a4538AF4Ba29d91D78fD6A4182','0x5fD5942c70C433630DeD2866564cE6154b30DF1d','0x463aF3092D5E7A3150a69d3c80BcE6428C384d4e','0xcdFbFA3309fB7e8Bc604F27f42D906f8E62B7797','0xBdc2F13A3D4c1852568Fe95dA71A88a7253EDA51','0x0c5D1220b0dFaEd89707E11328d29b3202FfcD5e','0x34f763fEBE8B58c952b31bD53c376Fcd02DC8Bb8','0x1bbDa612525d0361a0C46fc001830a6E0dDb7eAa','0xA8e770D5976A2E54F9D5c3A16c41a1aACa0244D6','0xb7846A827E60756dAa7aef93De4E7D3926B35F04','0x64BED09E2a35711d1635CeDFB4330948cF36d851','0x5b30aC36951E5E89F12606B3AB65883c98051622','0x06cADC487479d39082d91e5FDc4D79a534fd960f','0xA92cd70cEA6D7D4b653a478DDeD8845362f04ecb','0x1090438FcaF18F8d632b2cEC525e8D22aCF8C10c','0xc84B9Eb01921843ea53C6314fBf7f4051A8Ee012','0x21b60c7a211365c9C662A6c96F00D9aCBB689431','0xd8148089D92E5579D5aD38Cf194f449893BA28C9','0x9C9E22B6d527a68279f8BdA25FdE4536341C3B8F','0x28608Fe38BAce2Ccbc7CD00D7188eB2fcf46720C','0x31BBA48CCE883e6E3a1819FdEEdedb175D6F028E','0x9557144de0EdaCD8b409Ca3b26965FF281129c1a','0x55CE30da603B3F3430C0A2782cE5E0aDE8318c84','0x9ca5FF1dA81f58e3BBEf308027489A76Ce51A3d8','0x7452faFF02a9678061220445Ad59c9E869baf2A9','0x1205942BD0e22f22099f51eccc0B799D9Eaf89f4','0xA68a00a7b74d0362cae1D6DBEA1797D8717dCc93','0x22fB43726E729dD87cE62C7549636730ca444050','0xFa265a98732Ad5267a1D9DB8da434aaBc4BA18c0','0x67c222D79349f4F1bE073b290ef4d486861da091','0xbEfF8217477165E49eb3cf5A6D72556E960A2B7F','0x44415C6431DbEDb2e71B08F7555cdfc588E7a151','0x11b2dB167E4Bd6d37AC327c6eA31BAB543D5f399','0x6590324dB19418308694855661D3ACfb60F40a4D','0x413Cb059a15f1De3FC236E432149918E46F4e6ed','0x4660Ab36ccD9c7F202888295C9B09C0411EC8b10','0xCfC852e4Dd47D6945698D9f998e6D77afC70825b','0x8c62482f04E5c4880ada47b0aaE7DB1f41A075f6','0x20f7F9b7C1AEF55106b9c4cF66fB316346B73B41','0xA3e2A974a9C64BA00A6baA7A30aAB6ebc6B79361','0x52644D60EAC051826Ae2a06948697a340bDF9219','0x83ebE573bFb90BBA32b474C3335Ca605b09A0bDD','0xED6e29b74f23886198222CdD11b550A15253eE91','0x121EC79e9Eb2540eB211797fa09052364A7d28C5','0xEFB1bBD484FB263157Ff831C0aA4E656948c4C82','0x6708dcC6D0Ae5f0EBf041bB6bD554e7B286CB3b3','0x9AF963583849b475B3A0ad7494DD0b7DC98C6CA3','0xaF41ECF2b33812D98Dd95BCbd535a96DB7f3f34C','0x36F3063183ca5345aFD6398178766f1967f682A0','0x3F09De61006749d249F39A6A271C2945D01F1d02','0xfBE6006A193560150F63902B7C8B69fa8739Bc95','0x41c2FBd5aDa023975d2c950bd4ECF93A6c2c97Ea','0x74984cf9640Faf8E4990701aEB04F732cE136E3c','0x353e98116a4FcA6b58902Cb583E560d2a024431D','0x863ab57e290e71AB618684991D4D2F569E798faD','0x8B883C6d8d675d833Ec74F226f34a608320D971a','0xE0568C693f34A40D02aEF14F6D10D4777722865B','0x5ab75956E646017a97391d62bD379821c6580475','0xcC7d830eD37b7dA4bcF6bCd4f2A09089DEF774B7','0xfEb06507E3749A49A9ea331A81037b78BB293305','0x41d83f790E9703B8fe43D9434aEc2cA259df18fF','0x2d4fFc4C47f994cf0d42e3C55cEb7502055821e8','0x857D165BE26B64a691eb225b6b1e4b64124e1a79','0xd50c6DE81DEdAbb67a92eE98ab342AF1032F324a','0xB9b40a1963720C0fc0a73aA279A04E0E940Eb6ff','0x95cF9511Bf739cBD2935f6B35515d9e11c9C5434','0xF3C3f536A70C09E7Eaf1E000809d5B6463c20573','0x1de45454DB147D32F827Ca8223Ac09C45B2753a0','0x65404Cf2d915703Df7Db23f1140e94f3e77fd9f2','0x3849058bb15Be2B674fFf357a38D3C53d4c21095','0x096A79F62Bd3D2b0F600C1733017d19Ed1B977B0','0x887a9f0873D48d9CdCFDc003A9cd8F4C6A4EB027','0x2F298e77bA4Fd4c0B6878938F6b4071927954086','0x0c442623B6B99C967d897077EA500E9aCddc8ab9','0xDb7015dfb194eEAA2018d1904AeC01EeA43ECd65','0x4fa268ff1EE3F33fcd14504E4e6377989341b7e2','0x6aA45342916483d3f015d363B6151f25dF735dD1','0x2112C519dcdC58b1bDa919F6f728c19a838Dd372','0x408C554D45e79cBfE1d671Ca6c3ea3a8FFE49B34','0x40CBD23A880fC32c607291BeC687697CaABD8803','0x5075F3b632EB8E16C4b14d04817701B7722eF786','0x7DC659Fe3CAC3d9dF1b24662fB9Ee5954cB6D308','0x6Bf5EE5390E49AE8C0Fa1E4aDa41B7e69d6C4c9B','0x810EcAc7a0f31dD0f32d68748a7242b1551E2496','0x9397D779c63FAAF7F2e4c358a35E58bf53CcCFa1','0x30Bb23A9b17D10F8a10386477254a1B67f31A82b','0x10Ea501CA01af7D91498987eA6340c7b51BAdDFF','0xbDE5935634469fb8090CFF5c891b5f99b4A679ED','0x671b7035a8a7c4072f14bD2C3060695d6b033484','0x39aAB27a82c66bDB1bca68B0DE71819833cA62A5','0xF8Fb5d7acB9eCd0B0050CbDd4c0a0647965F0DBF','0x4646Fd1a0153bA28B2A33433d811604c41ad6914','0xD5cd2C1D39c2f1162E8056e7a79e09c681674f27','0x11d5A07Cfcf40A445DF13C15f5c6D093c001ffBB','0x14720EE0555Ac02aac7cD59a0D72Caf56025ca97','0x3cf2dde4b15AF46aa18864Ce94725f9019283576','0xD3ad937516a7E19C3c9562462e3a9BEB554Be11E','0x2f2FD29Ca72D0550fd7C52c4a711dCe4fa731Eba','0x524d63FB924D0d7BbEB93b50a73d548bf388F04B','0xD9052b142CEa223d913b6b786AA707C4E6C195dC','0xe10a69711a1e7034303f7a191FD448e5B2F552bF','0xc64797e6caB5C08B68Bcd118e3A22761e582E241','0xfcEA932cE672b998D3D06eAF140a3Ef29336c30E','0xc6b094623AEef377974ad372B7a5D42a0faea524','0x5E7649920B4bc9681b77480361A4d850e3b83388','0x946211AA9a8e1dc8652752715163402Dcf24035C','0x09d6679f6913b32Ccf0CD3803e688a3a496452D7','0x40c7E9977d99fD3Db838FfB1E312AD9E2423c457','0x20f634dB547e9E64802F53E95565a82C0D26B031','0x961e3d246748d00dcfC0894783bC0C161861C22B','0xa1eA8228d2c3d0766E3817b22b7C2BE1aFaad2a2','0x4F7934A9576a78213f821708298FBE51beDfb9DB','0x4a20B67AC0519CF1677Da336eB300FA4132Af88e','0x987780A38342516068e0166aF603939E41b61a1C','0x104fcdbd268EB4091889d89E026be21e4b38868d','0x8D618e25F34a17da3809C6222f5CAFF1410129A5','0xB2069a5506b15B98284d2f249716d38FC5B9bbbD','0x1358a617CB1aa22513adB315dc33E58c8c046B93','0x8763E8C8faA98dC78f9Cc797570410976f178933','0x92B0d17889d5A36Bc63f756d04Ec369aC2614E36','0xb6518414C8eE49BEC909c9f7fA819b01C8929Ac0','0x6a5Adc59e769044B16314097e76EBE3F27794A5a','0xA6aD1cd1822668e2a3aC84608dD0dc3c80388339','0x010a041197306B8aE721C2af4a51c4DdB3874208','0x0ce476B12F4c31aD9702F7ca4b09fE08D8f7d434','0x7992aFd7D74e28BB0729a45b6723cA909f4BcEf1','0x99eCBAfb517fea2bd2A3c40dAEE6696E84951b70','0xbaD4dc6BC16b35A9376F403655048D9f20Fb47f5','0x433021eD1FCb241F3B0C5FD76e58c05ebB4F87EA','0xD04F8aB079F4f9e3e5B970a26a8678A126AaF283','0x22E3cD8dDE0506Cd61876A86b77c90d444E7317D','0x42cc45EB4eeF3ae9CD11341679DD3b75BfbbfBf5','0xcdA528D8dF68f9E44728248a4F4c0872207771bb','0x6B01259Eaea929717460eB1d20981288cc2a6f3E','0x9f96eD62205F88ebB352cdF46306b3d720C8eC0F','0x5ec7847e5284585a0af4dEC750626A5b38526de0','0x353E07F362E8315a3B4F00d67C67d5B489FA7880','0x9fBFd590FF177aB27AdD89b8f071870EFA0BB0E3','0x210f6a9E076Af8d46d25E523f02c52cFEEDE535e','0xa5B8E55841af8cE7ba26f5e8e6B9bE48dF021E20','0x33c68B77aF2c6A375F038Cbdb3D6eDa9aF7cB274','0x9dA577bE5727D7FeB03e3115DDa2e6893d301884','0x14358553c0318e3342769df2f5B7375152F6964E','0x8eDFcb711fDb02F495a22a7356b22B5E3B9FFC26'],
    },

    // Amount of shares each payee receives
    // Error will be thrown if array is empty
    AIRDROP_PAYMENT_SPLITTER_SHARES: {
        1: [1219451750600,2438903500800,2438903501050,3658355251400,1829177625800,8536162253200,3658355251550,21950131508550,1412280206150,25608486760000,16462598631450,2438903500800,1829177625800,3435570441500,1829177625800,609725875250,609725875250,4268081126600,12804243380200,64021216899800,26644276180600,6097258752500,1219451750600,12194517505000,2438903500800,1829177625800,7703651568350,609725875250,2438903500800,7316710502800,9145888128600,4268081126600,609725875250,91458881285200,8536162253400,19511228007600,609725875250,3658355251600,62192039274000,1829177625800,3048629376300,1829177625800,13413969255400,609725875250,3048629376300,2438903500800,4877807002000,14023695130500,609725875250,5487532877200,2438903500800,5487532877200,6097258752500,7316710502800,1829177625800,1829177625800,6097258752500,4268081126600,609725875250,3048629376300,7316710502800,3658355251600,5487532877200,6097258752500,2438903500800,2438903500800,1883711220060,3658355251600,1829177625800,1829177625800,3658355251600,6097258752500,1829177625800,1829177625800,1829177625800,1829177625800,1829177625800,1829177625800,1829177625800,3658355251600,6097258752500,1829177625800,1829177625800,3658355251600,187185843693600,4877807002000,7316710502800,609725875250,609725875250,1219451750600,2438903500800,1829177625800,609725875250,1829177625800,1219451750600,3658355251600,609725875250,3048629376300,1219451750600,6097258752500,7316710502800,1829177625800,1219451750600,1829177625800,609725875250,1219451750600,2438903500800,1829177625800,1829177625800,3658355251600,1829177625800,1829177625800,12194517505000,20120953882800,6097258752500,5487532877200,4877807002000,7316710502800,1606392815700,1548817058090,2141857087300,2677321359400,6425571262300,5354642718600,535464271870,4450366864470,1070928543800,535464271870,17134856699700,3212785631300,1349613116610,1070928543800,1606392815700,2141857087300,3212785631300,1606392815700,535464271870,1606392815700,1606392815700,2141857087300,933230376200,466615188070,933230376140,933230376200,1399845564270,1399845564300,466615188070,2333075940400,2799691128500,21930913839000,1399845564270,1399845564300,401277165400,401277165400,1203831496300,401277165400,1203831496300,1203831496300,3210217323300,7222988977300,3210217323300,1203831496300,1203831496300,3717382152800,1013831496300,1013831496300,675887664200,1013831496300,14009710476800,21628405252300,1013831496300,1689719160400,1013831496300,675887664200,4007541319400,836053718500,278684572810,557369145700,1672107436900,1672107436900,1672107436900,557369145700,1393422864100,442217630500,1493591410300,221108815230,2653305782700,663326445800,663326445800,164869326500,164869326500,494607979600,989215959000,329063425100,329063425100,329063425100,109687808350,327201565600,109067188500,272667971300],
        4: [1219451750600,2438903500800,2438903501050,3658355251400,1829177625800,8536162253200,3658355251550,21950131508550,1412280206150,25608486760000,16462598631450,2438903500800,1829177625800,3435570441500,1829177625800,609725875250,609725875250,4268081126600,12804243380200,64021216899800,26644276180600,6097258752500,1219451750600,12194517505000,2438903500800,1829177625800,7703651568350,609725875250,2438903500800,7316710502800,9145888128600,4268081126600,609725875250,91458881285200,8536162253400,19511228007600,609725875250,3658355251600,62192039274000,1829177625800,3048629376300,1829177625800,13413969255400,609725875250,3048629376300,2438903500800,4877807002000,14023695130500,609725875250,5487532877200,2438903500800,5487532877200,6097258752500,7316710502800,1829177625800,1829177625800,6097258752500,4268081126600,609725875250,3048629376300,7316710502800,3658355251600,5487532877200,6097258752500,2438903500800,2438903500800,1883711220060,3658355251600,1829177625800,1829177625800,3658355251600,6097258752500,1829177625800,1829177625800,1829177625800,1829177625800,1829177625800,1829177625800,1829177625800,3658355251600,6097258752500,1829177625800,1829177625800,3658355251600,187185843693600,4877807002000,7316710502800,609725875250,609725875250,1219451750600,2438903500800,1829177625800,609725875250,1829177625800,1219451750600,3658355251600,609725875250,3048629376300,1219451750600,6097258752500,7316710502800,1829177625800,1219451750600,1829177625800,609725875250,1219451750600,2438903500800,1829177625800,1829177625800,3658355251600,1829177625800,1829177625800,12194517505000,20120953882800,6097258752500,5487532877200,4877807002000,7316710502800,1606392815700,1548817058090,2141857087300,2677321359400,6425571262300,5354642718600,535464271870,4450366864470,1070928543800,535464271870,17134856699700,3212785631300,1349613116610,1070928543800,1606392815700,2141857087300,3212785631300,1606392815700,535464271870,1606392815700,1606392815700,2141857087300,933230376200,466615188070,933230376140,933230376200,1399845564270,1399845564300,466615188070,2333075940400,2799691128500,21930913839000,1399845564270,1399845564300,401277165400,401277165400,1203831496300,401277165400,1203831496300,1203831496300,3210217323300,7222988977300,3210217323300,1203831496300,1203831496300,3717382152800,1013831496300,1013831496300,675887664200,1013831496300,14009710476800,21628405252300,1013831496300,1689719160400,1013831496300,675887664200,4007541319400,836053718500,278684572810,557369145700,1672107436900,1672107436900,1672107436900,557369145700,1393422864100,442217630500,1493591410300,221108815230,2653305782700,663326445800,663326445800,164869326500,164869326500,494607979600,989215959000,329063425100,329063425100,329063425100,109687808350,327201565600,109067188500,272667971300],
    },

    // --------- Router Proxy --------- //

    ROUTER_PROXY_PARTNER: {
       1: '0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7',
       4: '0xee936e648cD998e9df4531dF77EF2D2AECA5921b',
       30: '0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7',
       56: '0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7',
       66: '0x50aA3d33800A1BF4B8ED76740Fd52dfB4Bb503E7',
       97: '0xee936e648cD998e9df4531dF77EF2D2AECA5921b',
    },

}
