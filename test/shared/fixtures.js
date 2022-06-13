const { expandTo18Decimals } = require("./utilities")

const env = require("../../scripts/constants/env")
const addresses = require("../../scripts/constants/addresses")
const initials = require("../../scripts/constants/initials")

const treasuryAddress = addresses.TREASURY[env.network]

const feeMinterTotalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.network]
const feeMinterToMintPercents = initials.FEE_MINTER_TO_MINT_PERCENTS[env.network]

const refRegStakeRewardPercent = initials.REFERRAL_STAKE_REWARD_PERCENT[env.network]
const refRegSwapRewardPercent = initials.REFERRAL_SWAP_REWARD_PERCENT[env.network]

const vaultStartBlock = initials.HELIX_VAULT_START_BLOCK[env.network]                         
const vaultLastRewardBlock = initials.HELIX_VAULT_LAST_REWARD_BLOCK[env.network]

const billion = 1000000000

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

    // 
    // Deploy misc contracts
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

    // deploy external factory for migrator
    const externalFactory = await factoryContractFactory.deploy()
    await externalFactory.initialize()

    // deploy external oracleFactory for migrator
    const externalOracleFactory = await oracleFactoryContractFactory.deploy()
    await externalOracleFactory.initialize(externalFactory.address)

    // deploy external router for external migrator
    const externalRouter = await routerContractFactory.deploy(
        externalFactory.address, weth.address
    )

    // 
    // Deploy main DEX contracts
    //

    // 0. deploy helix token
    const helixToken = await helixTokenContractFactory.deploy()  

    // 1. deploy helix nft
    const helixNft = await helixNftContractFactory.deploy()

    // 2. deploy fee minter
    const feeMinterContractFactory = await ethers.getContractFactory("FeeMinter")
    const feeMinter = await feeMinterContractFactory.deploy(
        feeMinterTotalToMintPerBlock
    )

    // 3. deploy helix nft bridge
    const helixNftBridge = await helixNftBridgeContractFactory.deploy(
        helixNft.address
    )

    // 4. deploy helix chef nft
    const helixChefNft = await helixChefNftContractFactory.deploy()
    await helixChefNft.initialize(helixNft.address, helixToken.address)

    // 5. deploy fee handler
    const feeHandler = await feeHandlerContractFactory.deploy()
    await feeHandler.initialize(treasuryAddress, helixChefNft.address)

    // 6. deploy referral register
    const referralRegister = await referralRegisterContractFactory.deploy()
    await referralRegister.initialize(
        helixToken.address,
        feeHandler.address,
        feeMinter.address,
        refRegStakeRewardPercent,
        refRegSwapRewardPercent,
        0
    )
    
    // 7. deploy helix vault
    const vault = await vaultContractFactory.deploy()
    await vault.initialize(
        helixToken.address,
        feeHandler.address,
        feeMinter.address,
        vaultStartBlock,
        vaultLastRewardBlock
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

    // 
    // Initialize misc contracts

    // init external factory
    await externalFactory.setOracleFactory(externalOracleFactory.address)

    // 
    // Initialize DEX contracts
    //
    
    // init helixToken
    await helixToken.addMinter(referralRegister.address)
    await helixToken.addMinter(vault.address)

    // init helixChefNFT
    await helixChefNft.addAccruer(feeHandler.address)

    // init feeMinter
    // TODO replace helixToken with masterChef when masterChef is deployed
    await feeMinter.setToMintPercents(
        [helixToken.address, referralRegister.address, vault.address],  
        feeMinterToMintPercents
    )

    // init factory
    await factory.setOracleFactory(oracleFactory.address)

    return { 
        tokenA,
        tokenB,
        tokenC,
        weth,
        externalFactory,
        externalOracleFactory,
        externalRouter,
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
    }
}
