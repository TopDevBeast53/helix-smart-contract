/**
 * @dev Interaction script for deployed Aura Migrator contract.
 * 
 * Run from project root using: 
 *      npx hardhat run scripts/interactMigrator.js --network testnetBSC
 */

require ('dotenv').config();

const verbose = true;

const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const migratorJson = require('../build/contracts/AuraMigrator.json');
const migratorAbi = migratorJson.abi;
const maxInt = ethers.constants.MaxUint256;

const Address = {
    Owner: '0x59201fb8cb2D61118B280c8542127331DD141654',                // Contract deployer
    User: '0x697419d2B31844ad7Fa4646499f8B81de79D2eB1',                 // Contract user
    TokenA: '0x4cf6e39860B875dEeb8c577a88438f1Bb84C455A',               // token A
    TokenB: '0xE80Bed05c18Cf4c491a82742A507D831B8aC1C0b',               // token B
    ExternalFactory: '0xf3B84A2183A3326C30F2f53237d0c6816F0833CB',      // Move token pair (A, B) from this
    ExternalRouter: '0xdb3B0F877123cfB92AA5A1EAF4A1E21665bD177c',       // Move token pair (A, B) from this
    Factory: '0xE1cF8D44Bb47b8915A70eA494254164f19b7080d',              // Move token pair (A, B) to this
    Router: '0x38433227c7a606ebb9ccb0acfcd7504224659b74',               // Move token pair (A, B) to this
    Migrator: '0xA95c10feBBB13f7730FecD4167c9A612e468A42b',             // Move token pair (A, B) using this
}

const overrides = {
    gasLimit: 6721975
}

let provider;
let owner, user;
let ITokenA, tokenA;
let ITokenB, tokenB;
let IExternalFactory, externalFactory;
let IExternalRouter, externalRouter;
let IFactory, factory;
let IRouter, router;
let IMigrator, migrator;
let externalPair;
let tx;

async function main() {
    if (verbose) {
        console.log(`Interact with Aura Migrator deployed at ${short(Address.Migrator)}`);
    }
    
    loadProvider();
    loadWallets();

    await loadTokenA();
    await loadTokenB();
    await loadExternalFactory();
    await loadExternalRouter();
    await loadFactory();
    await loadRouter();
    await loadMigrator();
    await loadExternalPair();

    await setAllowanceMax(tokenA, migrator.address);
    await setAllowanceMax(tokenB, migrator.address);
    await setAllowanceMax(externalPair, migrator.address);
    await setAllowanceMax(tokenA, externalRouter.address);
    await setAllowanceMax(tokenB, externalRouter.address);
    await setAllowanceMax(externalPair, externalRouter.address);
    
    const amountTokenA = 100000;
    const amountTokenB = 100000;
    const [reservesA, reservesB] = await externalPair.getReserves();
    // If either reserve is less than the amount of token then add liquidity.
    if (reservesA.lt(ethers.BigNumber.from(amountTokenA)) || reservesB.lt(ethers.BigNumber.from(amountTokenB))) {
        await addLiquidity(externalRouter, amountTokenA, amountTokenB);
    }

    if (verbose) {
        console.log('Done');
    }
}

function loadProvider() {
    if (verbose) { console.log('Load provider'); }
    provider = new ethers.providers.getDefaultProvider(rpc);
}

function loadWallets() {
    if (verbose) { console.log('Load wallets'); }
    owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    user = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);
}

async function loadTokenA() {
    if (verbose) { console.log('Load token A'); }
    ITokenA = await ethers.getContractFactory('TestToken');
    tokenA = await ITokenA.attach(Address.TokenA).connect(owner);
}

async function loadTokenB() {
    if (verbose) { console.log('Load token B'); }
    ITokenB = await ethers.getContractFactory('TestToken');
    tokenB = await ITokenB.attach(Address.TokenB).connect(owner);
}

async function loadExternalFactory() {
    if (verbose) { console.log('Load external factory'); }
    IExternalFactory = await ethers.getContractFactory('AuraFactory');
    externalFactory = await IExternalFactory.attach(Address.ExternalFactory).connect(owner);
}

async function loadExternalRouter() {
    if (verbose) { console.log('Load external router'); }
    IExternalRouter = await ethers.getContractFactory('AuraRouterV1');
    externalRouter = await IExternalRouter.attach(Address.ExternalRouter).connect(owner);
}

async function loadFactory() {
    if (verbose) { console.log('Load factory'); }
    IFactory = await ethers.getContractFactory('AuraFactory');
    factory = await IFactory.attach(Address.Factory).connect(owner);
}

async function loadRouter() {
    if (verbose) { console.log('Load router'); }
    IRouter = await ethers.getContractFactory('AuraRouterV1');
    router = await IRouter.attach(Address.Router).connect(owner);
}

async function loadMigrator() {
    if (verbose) { console.log('Load migrator'); }
    IMigrator = await ethers.getContractFactory('AuraMigrator');
    migrator = await IMigrator.attach(Address.Migrator).connect(owner);
}

async function loadExternalPair() {
    let externalPairAddress = await externalFactory.getPair(tokenA.address, tokenB.address);
    if (externalPairAddress == ethers.constants.AddressZero) {
        externalPairAddress = await externalFactory.createPair(tokenA.address, tokenB.address, overrides);
        await externalPairAddress.wait();
    }

    const AuraPair = require('../build/contracts/AuraPair.json');    
    externalPair = new ethers.Contract(externalPairAddress, JSON.stringify(AuraPair.abi), provider).connect(owner);

    if (verbose) { 
        console.log(`External pair address: ${externalPair.address}`); 
    }
}

async function setAllowanceMax(token, address) {
    const allowance = await token.allowance(owner.address, address);
    if (!allowance.eq(maxInt)) {
        await token.approve(address, maxInt);
    }
    if (verbose) {
        console.log(`Set max allowance for ${short(address)} on ${short(token.address)}`);
    }
}

async function addLiquidity(_router, amountTokenA, amountTokenB) { 
    await _router.addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.BigNumber.from(amountTokenA),
        ethers.BigNumber.from(amountTokenB),
        0, 
        0,
        owner.address,
        maxInt,
        overrides
    );

    if (verbose) {
        console.log(`Add ${amountTokenA} tokenA and ${amountTokenB} tokenB in liquidity to ${short(router.address)}`);
    }
}

/**
* @dev Shorten the given string to the first and last n characters.
*/
function short(str, n=4) {
    const first = str.slice(2, n+2);
    const last = str.slice(str.length-n, str.length);
    const newStr = `${first}...${last}`;
    return newStr;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

