/* 
 * @dev Used to (re)build all required referrences between deployed contracts
 * 
 * Run from project root using:
 *     npx hardhat run scripts/deploymentHelper.js --network testnetBSC
 */

const verbose = true

const overrides = {
    gasLimit: 9999999
}

require ('dotenv').config()
const env = require('./constants/env')

const initials = require('./constants/initials')
const auraChefNFTStartBlock = initials.NFTCHEF_START_BLOCK[env.network];
const auraChefNFTRewardPerBlock = initials.NFTCHEF_REWARD_PER_BLOCK[env.network];

const contracts = require('./constants/contracts')
const factoryAddress = contracts.factory[env.network]
const routerAddress = contracts.router[env.network]
const auraTokenAddress = contracts.auraToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const refRegAddress = contracts.referralRegister[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const autoAuraAddress = contracts.autoAura[env.network]
const smartChefAddress = contracts.smartChef[env.network]
const auraNFTAddress = contracts.auraNFT[env.network]
const auraNFTChefAddress = contracts.auraNFTChef[env.network]
const auraNFTBridgeAddress = contracts.auraNFTBridge[env.network]
const auraLPAddress = contracts.apToken[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]
const migratorAddress = contracts.auraMigrator[env.network]
const tokenToolsAddress = contracts.tokenTools[env.network]

let wallet
let factory
let router
let auraToken
let oracleFactory
let refReg
let masterChef
let autoAura
let smartChef
let auraNFT
let auraNFTChef
let auraNFTBridge
let auraLP
let swapRewards
let migrator
let tokenTools

// build all require connections between contracts
async function main() {
    // load the provider and wallet
    await initScript() 

    // load the contract instances used in this script
    await loadContracts()

    // for each init[Contract] call functions on Contract
    // which register another contract with Contract
    await initFactory();
    await initRouter();
    await initAuraToken();
    await initRefReg();
    await initAuraNFT();
    await initAuraChefNFT();
    await initAuraNFTBridge(); 

    print('done')
}

// load the provider and 
async function initScript() {
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545'
    const provider = new ethers.providers.getDefaultProvider(rpc)

    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    print(`load wallet: ${wallet.address}\n`)
}

async function loadContracts() {
    print('load contracts:')

    print(`load factory: ${factoryAddress}`)
    const IFactory = await ethers.getContractFactory('AuraFactory')
    factory = await IFactory.attach(factoryAddress).connect(wallet)

    print(`load router: ${routerAddress}`)
    const IRouter = await ethers.getContractFactory('AuraRouterV1')
    router = await IRouter.attach(routerAddress).connect(wallet)

    print(`load AURA token: ${auraTokenAddress}`)
    const IAuraToken = await ethers.getContractFactory('AuraToken')
    auraToken = await IAuraToken.attach(auraTokenAddress).connect(wallet)

    print(`load oracle factory: ${oracleFactoryAddress}`)
    const IOracleFactory = await ethers.getContractFactory('OracleFactory')
    oracleFactory = await IOracleFactory.attach(oracleFactoryAddress).connect(wallet)

    print(`load referral register: ${refRegAddress}`)
    const IRefReg = await ethers.getContractFactory('ReferralRegister')
    refReg = await IRefReg.attach(refRegAddress).connect(wallet)

    print(`load master chef: ${masterChefAddress}`)
    const IMasterChef = await ethers.getContractFactory('MasterChef')
    masterChef = await IMasterChef.attach(masterChefAddress).connect(wallet)

    print(`load auto aura: ${autoAuraAddress}`)
    const IAutoAura = await ethers.getContractFactory('AutoAura')
    autoAura = await IAutoAura.attach(autoAuraAddress).connect(wallet)

    print(`load smart chef: ${smartChefAddress}`)
    const ISmartChef = await ethers.getContractFactory('SmartChef')
    smartChef = await ISmartChef.attach(smartChefAddress).connect(wallet)

    print(`load aura NFT: ${auraNFTAddress}`)
    const IAuraNFT = await ethers.getContractFactory('AuraNFT')
    auraNFT = await IAuraNFT.attach(auraNFTAddress).connect(wallet)

    print(`load aura NFT chef: ${auraNFTChefAddress}`)
    const IAuraNFTChef = await ethers.getContractFactory('AuraChefNFT')
    auraNFTChef = await IAuraNFTChef.attach(auraNFTChefAddress).connect(wallet)

    print(`load aura NFT bridge: ${auraNFTBridgeAddress}`)
    const IAuraNFTBridge = await ethers.getContractFactory('AuraNFTBridge')
    auraNFTBridge = await IAuraNFTBridge.attach(auraNFTBridgeAddress).connect(wallet)

    print(`load aura LP: ${auraLPAddress}`)
    const IAuraLP = await ethers.getContractFactory('AuraLP')
    auraLP = await IAuraLP.attach(auraLPAddress).connect(wallet)

    print(`load swap rewards: ${swapRewardsAddress}`)
    ISwapRewards = await ethers.getContractFactory('SwapRewards')
    swapRewards = await ISwapRewards.attach(swapRewardsAddress).connect(wallet)

    print(`load migrator: ${migratorAddress}`)
    IMigrator = await ethers.getContractFactory('AuraMigrator')
    migrator = await IMigrator.attach(migratorAddress).connect(wallet)

    print(`load token tools: ${tokenToolsAddress}`)
    ITokenTools = await ethers.getContractFactory('TokenTools')
    tokenTools = await ITokenTools.attach(tokenToolsAddress).connect(wallet)

    print('\n')
}

async function initFactory() {
    print(`init factory`)

    print(`register oracle factory with factory`)
    await factory.setOracleFactory(oracleFactory.address, overrides)
    print(`done`)

    print(`\n`)
}

async function initRouter() {
    print(`init router`)

    print(`register swap rewards with router`)
    await router.setSwapRewards(swapRewards.address, overrides)
    print(`done`)

    print(`\n`)
}


async function initAuraToken() {
    print(`init aura token`)

    print(`register referral register as aura token minter`)
    await auraToken.addMinter(refReg.address, overrides)
    print(`done`)

    print(`register master chef as aura token minter`)
    await auraToken.addMinter(masterChef.address, overrides)
    print(`done`)

    print(`register swap rewards as aura token minter`)
    await auraToken.addMinter(swapRewards.address, overrides)
    print(`done`)

    print(`\n`)
}

async function initRefReg() {
    print(`init referral register`)

    print(`register master chef as referral register recorder`) 
    await refReg.addRecorder(masterChef.address, overrides)
    print(`done`)

    print(`register swap rewarsds as referral register recorder`) 
    await refReg.addRecorder(swapRewards.address, overrides)
    print(`done`)

    print(`\n`)
}

async function initSmartChef() {
    print(`init smart chef`)
    print(`did you remember to fund smart chef with reward tokens`)
    print(`\n`)
}

async function initAuraNFT() {
    print(`init aura NFT`)

    print(`register wallet as aura NFT minter`)
    await auraNFT.addMinter(wallet.address, overrides)
    print(`done`)

    print(`register aura chef NFT as aura NFT staker`)
    await auraNFT.addStaker(auraNFTChef.address, overrides)
    print(`done`)

    print(`register aura nft bridge as aura NFT minter`)
    await auraNFT.addMinter(auraNFTBridge.address, overrides)
    print(`done`)

    print(`register swap rewards as aura NFT accruer`)
    await auraNFT.addAccruer(swapRewards.address, overrides)
    print(`done`)

    print(`\n`)
}

async function initAuraChefNFT() {
    print(`init aura chef NFT`)

    print(`register aura token as aura chef NFT reward token`)
    try {
        // fails if auraToken has already been registered
        await auraNFTChef.addNewRewardToken(
            auraToken, 
            auraChefNFTStartBlock, 
            auraChefNFTRewardPerBlock, 
            overrides
        )
    } catch(error) {
        console.error(error)
    }
    print(`done`)

    print(`did you remember to fund aura chef NFT with reward tokens`)

    print(`\n`)
}

async function initAuraNFTBridge() {
    print(`init aura NFT bridge`)

    print(`register wallet as aura NFT bridge bridger`)
    await auraNFTBridge.addBridger(wallet.address, overrides)
    print(`done`)

    print(`\n`)
}

function print(str) {
    if (verbose) console.log(str)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
