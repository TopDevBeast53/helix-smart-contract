/* 
 * @dev Used to (re)build all required referrences between deployed contracts
 * 
 * Run from project root using:
 *     npx hardhat run scripts/0_deploymentHelper.js --network testnetBSC
 */

const verbose = true

const overrides = {
    gasLimit: 9999999
}

require ('dotenv').config()
const env = require('./constants/env')

const initials = require('./constants/initials')
const helixChefNFTStartBlock = initials.NFTCHEF_START_BLOCK[env.network];
const helixChefNFTRewardPerBlock = initials.NFTCHEF_REWARD_PER_BLOCK[env.network];

const contracts = require('./constants/contracts')
const factoryAddress = contracts.factory[env.network]
const routerAddress = contracts.router[env.network]
const helixTokenAddress = contracts.helixToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const refRegAddress = contracts.referralRegister[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const autoHelixAddress = contracts.autoHelix[env.network]
const smartChefAddress = contracts.smartChef[env.network]
const helixNFTAddress = contracts.helixNFT[env.network]
const helixNFTChefAddress = contracts.helixNFTChef[env.network]
const helixNFTBridgeAddress = contracts.helixNFTBridge[env.network]
const helixLPAddress = contracts.hpToken[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]
const migratorAddress = contracts.helixMigrator[env.network]
const tokenToolsAddress = contracts.tokenTools[env.network]

let wallet
let factory
let router
let helixToken
let oracleFactory
let refReg
let masterChef
let autoHelix
let smartChef
let helixNFT
let helixNFTChef
let helixNFTBridge
let helixLP
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
    await initHelixToken();
    await initRefReg();
    await initHelixNFT();
    await initHelixChefNFT();
    await initHelixNFTBridge(); 

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
    const IFactory = await ethers.getContractFactory('HelixFactory')
    factory = await IFactory.attach(factoryAddress).connect(wallet)

    print(`load router: ${routerAddress}`)
    const IRouter = await ethers.getContractFactory('HelixRouterV1')
    router = await IRouter.attach(routerAddress).connect(wallet)

    print(`load HELIX token: ${helixTokenAddress}`)
    const IHelixToken = await ethers.getContractFactory('HelixToken')
    helixToken = await IHelixToken.attach(helixTokenAddress).connect(wallet)

    print(`load oracle factory: ${oracleFactoryAddress}`)
    const IOracleFactory = await ethers.getContractFactory('OracleFactory')
    oracleFactory = await IOracleFactory.attach(oracleFactoryAddress).connect(wallet)

    print(`load referral register: ${refRegAddress}`)
    const IRefReg = await ethers.getContractFactory('ReferralRegister')
    refReg = await IRefReg.attach(refRegAddress).connect(wallet)

    print(`load master chef: ${masterChefAddress}`)
    const IMasterChef = await ethers.getContractFactory('MasterChef')
    masterChef = await IMasterChef.attach(masterChefAddress).connect(wallet)

    print(`load auto helix: ${autoHelixAddress}`)
    const IAutoHelix = await ethers.getContractFactory('AutoHelix')
    autoHelix = await IAutoHelix.attach(autoHelixAddress).connect(wallet)

    print(`load smart chef: ${smartChefAddress}`)
    const ISmartChef = await ethers.getContractFactory('SmartChef')
    smartChef = await ISmartChef.attach(smartChefAddress).connect(wallet)

    print(`load helix NFT: ${helixNFTAddress}`)
    const IHelixNFT = await ethers.getContractFactory('HelixNFT')
    helixNFT = await IHelixNFT.attach(helixNFTAddress).connect(wallet)

    print(`load helix NFT chef: ${helixNFTChefAddress}`)
    const IHelixNFTChef = await ethers.getContractFactory('HelixChefNFT')
    helixNFTChef = await IHelixNFTChef.attach(helixNFTChefAddress).connect(wallet)

    print(`load helix NFT bridge: ${helixNFTBridgeAddress}`)
    const IHelixNFTBridge = await ethers.getContractFactory('HelixNFTBridge')
    helixNFTBridge = await IHelixNFTBridge.attach(helixNFTBridgeAddress).connect(wallet)

    print(`load helix LP: ${helixLPAddress}`)
    const IHelixLP = await ethers.getContractFactory('HelixLP')
    helixLP = await IHelixLP.attach(helixLPAddress).connect(wallet)

    print(`load swap rewards: ${swapRewardsAddress}`)
    ISwapRewards = await ethers.getContractFactory('SwapRewards')
    swapRewards = await ISwapRewards.attach(swapRewardsAddress).connect(wallet)

    print(`load migrator: ${migratorAddress}`)
    IMigrator = await ethers.getContractFactory('HelixMigrator')
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


async function initHelixToken() {
    print(`init helix token`)

    print(`register referral register as helix token minter`)
    await helixToken.addMinter(refReg.address, overrides)
    print(`done`)

    print(`register master chef as helix token minter`)
    await helixToken.addMinter(masterChef.address, overrides)
    print(`done`)

    print(`register swap rewards as helix token minter`)
    await helixToken.addMinter(swapRewards.address, overrides)
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

async function initHelixNFT() {
    print(`init helix NFT`)

    print(`register wallet as helix NFT minter`)
    await helixNFT.addMinter(wallet.address, overrides)
    print(`done`)

    print(`register helix chef NFT as helix NFT staker`)
    await helixNFT.addStaker(helixNFTChef.address, overrides)
    print(`done`)

    print(`register helix nft bridge as helix NFT minter`)
    await helixNFT.addMinter(helixNFTBridge.address, overrides)
    print(`done`)

    print(`register swap rewards as helix NFT accruer`)
    await helixNFT.addAccruer(swapRewards.address, overrides)
    print(`done`)

    print(`\n`)
}

async function initHelixChefNFT() {
    print(`init helix chef NFT`)

    print(`register helix token as helix chef NFT reward token`)
    try {
        // fails if helixToken has already been registered
        await helixNFTChef.addNewRewardToken(
            helixToken, 
            helixChefNFTStartBlock, 
            helixChefNFTRewardPerBlock, 
            overrides
        )
    } catch(error) {
        console.error(error)
    }
    print(`done`)

    print(`did you remember to fund helix chef NFT with reward tokens`)

    print(`\n`)
}

async function initHelixNFTBridge() {
    print(`init helix NFT bridge`)

    print(`register wallet as helix NFT bridge bridger`)
    await helixNFTBridge.addBridger(wallet.address, overrides)
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
