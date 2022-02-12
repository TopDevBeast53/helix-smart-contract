/**
 * @dev Interaction script for deployed Aura Migrator contract.
 * 
 * Run from project root using: 
 *      npx hardhat run scripts/interactMigrator.js --network testnetBSC
 */

require ('dotenv').config();

const verbose = true;
const maxInt = ethers.constants.MaxUint256;
const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';

const Name = {
    Factory: 'AuraFactory',
    Router: 'AuraRouterV1',
    Migrator: 'AuraMigrator',
    Token: 'TestToken',
    Pair: 'AuraPair',
}

const Address = {
    Owner: '0x59201fb8cb2D61118B280c8542127331DD141654',                // Contract deployer
    User: '0x697419d2B31844ad7Fa4646499f8B81de79D2eB1',                 // Contract user
    TokenA: '0x360f6135472195caabEA67c7C6b83E3767F96762',               // token A
    TokenB: '0xd239560c0d8Ae7EB66c5f691F32a7D7857cEDc58',               // token B
    ExternalRouter: '0x7dc5ac586e26B0Ae1aF00EA26249B49b4cF33d4C',       // Move token pair (A, B) from this
    Router: '0x38433227c7a606ebb9ccb0acfcd7504224659b74',               // Move token pair (A, B) to this
    Migrator: '0x6D237B35cCa79f367Ecac7743555C3f3213fA77f',             // Move token pair (A, B) using this
}

const overrides = {
    gasLimit: 6721975
}

async function main() {
    if (verbose) { console.log(`interact with Aura Migrator deployed at ${short(Address.Migrator)}`); }

    const provider = getProvider();
    const [owner, user] = getWallets(provider);

    // Load the contracts that will be used.
    const tokenA = await getContract(Name.Token, Address.TokenA, owner);
    const tokenB = await getContract(Name.Token, Address.TokenB, owner);

    const externalRouter = await getContract(Name.Router, Address.ExternalRouter, owner);
    const externalFactory = await getContract(Name.Factory, await externalRouter.factory(), owner);

    const router = await getContract(Name.Router, Address.Router, owner);
    const factory = await getContract(Name.Factory, await router.factory(), owner);

    const migrator = await getContract(Name.Migrator, Address.Migrator, owner);

    // Prepare for migration by transferring funds to the external exchange.
    await approve(tokenA, externalRouter.address);
    await approve(tokenB, externalRouter.address);
   
    const amountA = '1000000000000000000000';  // 10,000 
    const amountB = '1000000000000000000000';  // 10,000
    await addLiquidity(externalRouter, owner.address, tokenA, tokenB, amountA, amountB);

    // Use pairs to check token reserves and wallet balances before and after liquidity migration.
    const externalPairAddress = await getPairAddress(externalFactory, tokenA, tokenB);
    const externalPair = await getContract(Name.Pair, externalPairAddress, owner);

    const pairAddress = await getPairAddress(factory, tokenA, tokenB);
    const pair = await getContract(Name.Pair, pairAddress, owner);
  
    // Log the initial state.
    if (verbose) { console.log('before liquidity migration'); }
    await logReserves('external pair', externalPair);
    await logReserves('pair', pair);
    await logBalance('external pair', externalPair, owner.address);
    await logBalance('pair', pair, owner.address);

    // Perform the migration and expect that funds move from externalPair to pair.
    await migrateLiquidity(migrator, tokenA, tokenB, externalPair, externalRouter);

    // Log the results.
    if (verbose) { console.log('after liquidity migration'); }
    await logReserves('external pair', externalPair);
    await logReserves('pair', pair);
    await logBalance('external pair', externalPair, owner.address);
    await logBalance('pair', pair, owner.address);

    if (verbose) { console.log('done'); }
}

function getProvider() {
    if (verbose) { console.log('get provider'); }
    return new ethers.providers.getDefaultProvider(rpc);
}

function getWallets(provider) {
    if (verbose) { console.log('get wallets'); }
    owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    user = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);
    return [owner, user];
}

async function getContract(name, address, wallet) {
    if (verbose) { console.log(`get ${name} from ${short(address)}`); }
    const ContractFactory = await ethers.getContractFactory(name);
    return await ContractFactory.attach(address).connect(wallet);
}

async function approve(token, address, amount=maxInt) {
    if (verbose) { console.log(`approve ${short(address)} on ${short(token.address)}`); }
    const allowance = await token.allowance(owner.address, address);
    if (!allowance.eq(amount)) {
        await token.approve(address, amount);
    }
}

async function addLiquidity(router, to, tokenA, tokenB, amountA, amountB) { 
    if (verbose) { console.log(`add liquidity using ${short(router.address)} to ${short(to)}`); }
    await router.addLiquidity(tokenA.address, tokenB.address, amountA, amountB, 0, 0, to, maxInt, overrides);
}

async function getPairAddress(factory, tokenA, tokenB) {
    let pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    if (pairAddress == ethers.constants.AddressZero) {
        console.log("ENTER IF");
        pairAddress = await factory.createPair(tokenA.address, tokenB.address, overrides);
        await pairAddress.wait();
    }
    return pairAddress;
}

async function logReserves(name, pair) {
    if (verbose) {
        const [reservesA, reservesB] = await pair.getReserves();
        console.log(`reserves of A in ${name}: ${reservesA}`);
        console.log(`reserves of B in ${name}: ${reservesB}`);
    }
}

async function logBalance(name, pair, address) {
    if (verbose) {
        const balance = await pair.balanceOf(address);
        console.log(`balance of ${short(address)} in ${name} is ${balance}`);
    }
}

async function migrateLiquidity(migrator, tokenA, tokenB, externalPair, externalRouter) {
    if (verbose) { console.log("migrate liquidity"); }
    let tx = await migrator.migrateLiquidity(tokenA.address, tokenB.address, externalPair.address, externalRouter.address, overrides);
    await tx.wait();
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
