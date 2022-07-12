const { expandTo18Decimals } = require("./utilities")

const env = require("../../scripts/constants/env")
const addresses = require("../../scripts/constants/addresses")
const initials = require("../../scripts/constants/initials")

const treasuryAddress = addresses.TREASURY[env.testNetwork]

const feeMinterTotalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.testNetwork]
const feeMinterToMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.testNetwork]

const feeHandlerDefaultNftChefPercent = initials.FEE_HANDLER_DEFAULT_NFT_CHEF_PERCENT[env.testNetwork]

const refRegStakeRewardPercent = initials.REFERRAL_STAKE_REWARD_PERCENT[env.testNetwork]
const refRegSwapRewardPercent = initials.REFERRAL_SWAP_REWARD_PERCENT[env.testNetwork]
const refRegCollectorPercent = initials.REFERRAL_COLLECTOR_PERCENT[env.testNetwork]

const vaultStartBlock = initials.HELIX_VAULT_START_BLOCK[env.testNetwork]                         
const vaultLastRewardBlock = initials.HELIX_VAULT_LAST_REWARD_BLOCK[env.testNetwork]
const vaultCollectorPercent = initials.HELIX_VAULT_COLLECTOR_PERCENT[env.testNetwork]

const chefStartBlock = initials.MASTERCHEF_START_BLOCK[env.testNetwork]
const chefStakingPercent = initials.MASTERCHEF_STAKING_PERCENT[env.testNetwork]
const chefDevPercent = initials.MASTERCHEF_DEV_PERCENT[env.testNetwork]

const publicPresaleInputRate = initials.PUBLIC_PRESALE_INPUT_RATE[env.testNetwork]                       
const publicPresaleOutputRate = initials.PUBLIC_PRESALE_OUTPUT_RATE[env.testNetwork]                     
const publicPresalePurchasePhaseDuration = initials.PUBLIC_PRESALE_PURCHASE_PHASE_DURATION[env.testNetwork]

const airdropWithdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[env.testNetwork]

const helixNftBridgeGasFeeEth = initials.BRIDGE_FEE_ETH_AMOUNT[env.testNetwork]

const billion = 1000000000

// 
// Define contract factories
// Deploy misc token contracts
// Deploy MultiSig wallets
// Deploy external DEX contracts
// Deploy DEX contracts
// Deploy presale contracts 
// Initialize external DEX contracts
// Initialize DEX contracts
//
module.exports.fullExchangeFixture = async () => {
    //
    // Define contract factories
    // 

    const testTokenContractFactory = await ethers.getContractFactory("TestToken")
    const helixTokenContractFactory = await ethers.getContractFactory("HelixToken")
    const helixNftContractFactory = await ethers.getContractFactory("HelixNFT")
    const helixNftBridgeContractFactory = await ethers.getContractFactory("HelixNFTBridge")
    const helixChefNftContractFactory = await ethers.getContractFactory("HelixChefNFT")
    const feeHandlerContractFactory = await ethers.getContractFactory("FeeHandler")
    const referralRegisterContractFactory = await ethers.getContractFactory("ReferralRegister")
    const vaultContractFactory = await ethers.getContractFactory("HelixVault")
    const factoryContractFactory = await ethers.getContractFactory("HelixFactory")
    const oracleFactoryContractFactory = await ethers.getContractFactory("OracleFactory")
    const wethContractFactory = await ethers.getContractFactory("WETH9")
    const routerContractFactory = await ethers.getContractFactory("HelixRouterV1")
    const migratorContractFactory = await ethers.getContractFactory("HelixMigrator")
    const swapRewardsContractFactory = await ethers.getContractFactory("SwapRewards")
    const masterChefContractFactory = await ethers.getContractFactory("MasterChef")
    const publicPresaleContractFactory = await ethers.getContractFactory("PublicPresale")
    const airdropContractFactory = await ethers.getContractFactory("AirDrop")
    const tokenMultiSigWalletContractFactory = await ethers.getContractFactory("TokenMultiSigWallet")
    const subMultiSigWalletContractFactory = await ethers.getContractFactory("MultiSigWallet")

    // 
    // Deploy misc token contracts
    //

    // deploy test tokens
    const tokenA = await testTokenContractFactory.deploy(
        "Token A", "TTA", expandTo18Decimals(1 * billion)
    )

    const tokenB = await testTokenContractFactory.deploy(
        "Token B", "TTB", expandTo18Decimals(1 * billion)
    )

    const tokenC = await testTokenContractFactory.deploy(
        "Token C", "TTC", expandTo18Decimals(1 * billion)
    )

    const weth = await wethContractFactory.deploy()

    //
    // Deploy MultiSig wallets
    //
    const [alice, bobby, carol, david, edith] = await ethers.getSigners()

    const tokenMultiSigWallet = await tokenMultiSigWalletContractFactory
        .deploy(
            [alice.address],
            [bobby.address, carol.address, david.address],
            0,
            2,
            "TokenMultiSigWallet"
        )

    const subMultiSigWallet = await subMultiSigWalletContractFactory
        .deploy(
            [],
            [alice.address, bobby.address, carol.address],
            0,
            2,
        )

    //
    // Deploy external DEX contracts
    // 

    const externalFactory = await factoryContractFactory.deploy()
    await externalFactory.initialize()

    const externalOracleFactory = await oracleFactoryContractFactory.deploy()
    await externalOracleFactory.initialize(externalFactory.address)

    const externalRouter = await routerContractFactory.deploy(
        externalFactory.address, weth.address
    )

    // 
    // Deploy core DEX contracts
    //

    // 0. deploy helix token
    const helixToken = await helixTokenContractFactory.deploy()  

    // 1. deploy helix nft
    const helixNft = await helixNftContractFactory.deploy()
    await helixNft.initialize('BASEURI') // TODO replace

    // 2. deploy fee minter
    const feeMinterContractFactory = await ethers.getContractFactory("FeeMinter")
    const feeMinter = await feeMinterContractFactory.deploy(
        feeMinterTotalToMintPerBlock
    )

    // 3. deploy helix nft bridge
    const helixNftBridge = await helixNftBridgeContractFactory.deploy(
        helixNft.address,
        alice.address,
        helixNftBridgeGasFeeEth,
        12   // TODO - replace with real value
    )

    // 4. deploy helix chef nft
    const helixChefNft = await helixChefNftContractFactory.deploy()
    await helixChefNft.initialize(helixNft.address, helixToken.address)

    console.log(`treasury addr ${treasuryAddress}`)
    console.log(`helix chef ${helixChefNft.address}`)
    console.log(`helix token ${helixToken.address}`)
    console.log(`defaultNftChefPercent ${feeHandlerDefaultNftChefPercent}`)

    // 5. deploy fee handler
    const feeHandler = await feeHandlerContractFactory.deploy()
    const defaultNftChefPercent = 0
    await feeHandler.initialize(
        treasuryAddress, 
        helixChefNft.address, 
        helixToken.address, 
        feeHandlerDefaultNftChefPercent
    )

    // 6. deploy referral register
    const referralRegister = await referralRegisterContractFactory.deploy()
    await referralRegister.initialize(
        helixToken.address,
        feeHandler.address,
        feeMinter.address,
        refRegStakeRewardPercent,
        refRegSwapRewardPercent,
        0,
        refRegCollectorPercent
    )
    
    // 7. deploy helix vault
    const vault = await vaultContractFactory.deploy()
    await vault.initialize(
        helixToken.address,
        feeHandler.address,
        feeMinter.address,
        vaultStartBlock,
        vaultLastRewardBlock,
        vaultCollectorPercent
    )

    // 8. deploy factory
    const factory = await factoryContractFactory.deploy()
    await factory.initialize()

    // 9. deploy oracle factory
    const oracleFactory = await oracleFactoryContractFactory.deploy()
    await oracleFactory.initialize(factory.address)

    // 10. deploy router
    const router = await routerContractFactory.deploy(factory.address, weth.address)

    // 11. deploy migrator
    const migrator = await migratorContractFactory.deploy(router.address)

    // 12. deploy swap rewards
    const swapRewards = await swapRewardsContractFactory.deploy(
        helixToken.address,
        oracleFactory.address,
        referralRegister.address,
        router.address
    )

    // 13. deploy master chef
    const masterChef = await masterChefContractFactory.deploy()
    await masterChef.initialize(
        helixToken.address,
        treasuryAddress,
        feeMinter.address,
        chefStartBlock,
        chefStakingPercent,
        chefDevPercent,
        referralRegister.address
    )

    // 14. deploy auto chef
    // TODO

    //
    // Deploy presale contracts
    // 

    // deploy public presale
    const publicPresale = await publicPresaleContractFactory.deploy(
        tokenA.address,
        helixToken.address,
        treasuryAddress,
        publicPresaleInputRate,
        publicPresaleOutputRate,
        publicPresalePurchasePhaseDuration
    )

    // deploy airdrop presale
    const airdrop = await airdropContractFactory.deploy(
        "Airdrop",
        helixToken.address,
        airdropWithdrawPhaseDuration
    )

    // 
    // Initialize external DEX contracts
    //

    // init external factory
    await externalFactory.setOracleFactory(externalOracleFactory.address)

    // 
    // Initialize DEX contracts
    //
    
    // init helixToken
    await helixToken.addMinter(referralRegister.address)
    await helixToken.addMinter(vault.address)
    await helixToken.addMinter(masterChef.address)
    // Temporary solution 
    await helixToken.addMinter(publicPresale.address) // approve to burn helix
    await helixToken.addMinter(airdrop.address) // approve to burn helix

    // init helixNft
    await helixNft.addStaker(helixChefNft.address)

    // init helixChefNFT
    await helixChefNft.addAccruer(feeHandler.address)

    // init feeMinter
    await feeMinter.setToMintPercents(
        [masterChef.address, referralRegister.address, vault.address],  
        feeMinterToMintPercents
    )

    // init factory
    await factory.setOracleFactory(oracleFactory.address)

    // init router
    await router.setSwapRewards(swapRewards.address)

    // init referral register
    await referralRegister.addRecorder(swapRewards.address)
    await referralRegister.addRecorder(masterChef.address)

    // init master chef
    await masterChef.setReferralRegister(referralRegister.address)

    return { 
        // Misc contracts
        tokenA,
        tokenB,
        tokenC,
        weth,
        // Multisig wallets
        tokenMultiSigWallet,
        subMultiSigWallet,
        // External contracts
        externalFactory,
        externalOracleFactory,
        externalRouter,
        // DEX contracts
        helixToken,
        helixNft,
        feeMinter,
        helixNftBridge,
        helixChefNft,
        feeHandler,
        referralRegister,
        vault,
        factory,
        oracleFactory,
        weth,
        router,
        migrator,
        swapRewards,
        masterChef,
        publicPresale,
        airdrop
    }
}
