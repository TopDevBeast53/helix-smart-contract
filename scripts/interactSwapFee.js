/* 
 * @dev Interaction script for deployed SwapFeeRewardsWithAP contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactSwapFee.js --network testnetBSC
 */

const verbose = true

require ('dotenv').config()
const contracts = require('./constants/contracts')
const env = require('./constants/env')

const factoryAddress = contracts.factory[env.network]
/*
const routerAddress = contracts.router[env.network]
const targetTokenAddress = contracts.helixToken[env.network]    // Note that targetTokenAddress == helixTokenAddress
const targetHPTokenAddress = contracts.helixLP[env.network]     // Note that targetHPTokenAddress == testTokenCAddress
// const oracleAddress = contracts.oracle[env.network]
const refRegAddress = contracts.referralRegister[env.network]
const helixTokenAddress = contracts.helixToken[env.network]
const helixNFTAddress = contracts.helixNFT[env.network]
const swapFeeAddress = contracts.swapFee[env.network]
const wbnbTokenAddress = contracts.WBNB[env.network]
const testTokenAAddress = contracts.testTokenA[env.network]
const testTokenBAddress = contracts.testTokenB[env.network]
*/

const gasLimit = 9999999
const addressZero = '0x0000000000000000000000000000000000000000'

const defaultRewardDistribution = 100
const userRewardDistribution = 100

let owner
let swapFee
let router
let factory
let oracle
let tokenA
let tokenB
let targetHPToken
let targetToken
let helixNFT
let helixToken
let wbnbToken
let refReg

async function main() {
    print('INTERACT SWAP FEE REWARDS WITH AP\n')
    
    await initScript() 
    await loadContracts()
    await printState()
    
    // await initContracts(tokenA, helixToken)

    /*
    let amount = 1000
    await swap(owner.address, testTokenAAddress, testTokenBAddress, amount)
    await withdraw()
    */

    print('done')
}

// Initialize this script's provider and wallet
async function initScript() {
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545'
    const provider = new ethers.providers.getDefaultProvider(rpc)

    owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    print(`wallet: \t${owner.address}\n`)
}

async function loadContracts() {
    /*
    print('deployed contract addresses:')
    print(`\tswapFee: \t${swapFeeAddress}`)
    */

    print(`\tfactory: \t${factoryAddress}`)
    const IFactory = await ethers.getContractFactory('HelixFactory')
    factory = await IFactory.attach(factoryAddress).connect(owner)

    /*
    print(`\trouter: \t${routerAddress}`)
    const IRouter = await ethers.getContractFactory('HelixRouterV1')
    router = await IRouter.attach(routerAddress).connect(owner)

    print(`\ttarget token: \t${targetTokenAddress}`)
    const ITestToken = await ethers.getContractFactory('TestToken')
    targetToken = await ITestToken.attach(targetTokenAddress).connect(owner)

    print(`\tAP token: \t${targetHPTokenAddress}`)
    // ITestToken already loaded
    // Using ITestToken since HelixLP fails to transfer
    targetHPToken = await ITestToken.attach(targetHPTokenAddress).connect(owner)

    print(`\toracle: \t${oracleAddress}`)
    const IOracle = await ethers.getContractFactory('Oracle')
    oracle = await IOracle.attach(oracleAddress).connect(owner)

    print(`\thelixToken: \t${helixTokenAddress}`)
    // ITestToken already loaded
    helixToken = await ITestToken.attach(helixTokenAddress).connect(owner)

    print(`\thelixNFT: \t${helixNFTAddress}`)
    const IHelixNFT= await ethers.getContractFactory('HelixNFT')
    helixNFT = await IHelixNFT.attach(helixNFTAddress).connect(owner)

    print(`\trefReg: \t${refRegAddress}`)
    const IRefReg= await ethers.getContractFactory('ReferralRegister')
    refReg = await IRefReg.attach(refRegAddress).connect(owner)
    
    print(`\ttokenA: \t${testTokenAAddress}`)
    // ITestToken already loaded
    tokenA = await ITestToken.attach(testTokenAAddress).connect(owner)

    print(`\ttokenB: \t${testTokenBAddress}`)
    // ITestToken already loaded
    tokenB = await ITestToken.attach(testTokenBAddress).connect(owner)

    print(`\tWBNB token: \t${wbnbTokenAddress}`)
    // ITestToken already loaded
    wbnbToken = await ITestToken.attach(wbnbTokenAddress).connect(owner)
    */

    print('\n')
}

async function printState() {
    print('swapFee state:')
    print(`\tfactory INIT CODE HASH \t\t${await factory.INIT_CODE_HASH()}`)
    print(`\tfactory address is \t\t${short(await swapFee.factory())}`)
    print(`\trouter address is \t\t${short(await swapFee.router())}`)
    print(`\ttarget token address is \t${short(await swapFee.targetToken())}`)
    print(`\tAP token address is \t\t${short(await swapFee.targetHPToken())}`)
    print(`\toracle address is \t\t${short(await swapFee.oracle())}`)
    print(`\thelixToken address is \t\t${short(await swapFee.helixToken())}`)
    print(`\thelixNFT address is \t\t${short(await swapFee.helixNFT())}`)
    print(`\trefReg address is \t\t${short(await swapFee.refReg())}`)
    print(`\ttotal mined HELIX is \t\t${await swapFee.totalMined()}`)
    print(`\ttotal accrued AP is \t\t${await swapFee.totalAccruedAP()}`)

    const pairsListLength = await swapFee.getPairsListLength()
    print(`\tpair addresses (${pairsListLength}):`)
    print(`\t\taddress, percentReward, isEnabled`)
    for (let i = 0; i < pairsListLength; i++) {
        const pair = await swapFee.pairsList(i)
        print(`\t\t${pair[0]}, ${pair[1]}, ${pair[2]}`)
    }

    print('\n')
}

async function initContracts(token0, token1) {
    // make all the necessary calls to the factory to prepare for swapFee to swap
    print('initFactory is disabled')
    // await initFactory(token0, token1)

    // make sure swapFee is registered with the router
    if (swapFee.address != await router.swapFeeReward()) {
        print(`registering swapFee ${short(swapFee.address)} with router ${short(router.address)}`)
        await router.setSwapFeeReward(swapFee.address, { gasLimit })
    } else {
        print('swapFee is registered with router')
    }

    // make sure swapFee is registered with refReg as recorder
    if (!(await refReg.isRecorder(swapFee.address))) {
        print(`registering swapFee ${short(swapfee.address)} as recorder with refReg ${short(refReg.address)}`)
        await refReg.addRecorder(swapFee.address, { gasLimit })
    } else {
        print('swapFee is registered as recorder with refReg\n')
    }

    /*
    // make sure that the user is registered as the owner's referrer
    if (await refReg.ref(owner.address) != user.address) {
        print(`registering ${short(user.address)} as a referrer for ${short(owner.address)} with refReg ${short(refReg.address)}`)
        await refReg.addRef(user.address, { gasLimit })
    } else {
        print(`${short(user.address)} is registered as ${short(owner.address)}'s referrer with refReg\n`)
    }
    */

    // make sure owner is an accruer
    if (!(await helixNFT.isAccruer(owner.address))) {
        print(`registering owner ${short(owner.address)} as accruer with helixNFT ${short(helixNFT.address)}`)
        await helixNFT.addAccruer(owner.address, { gasLimit })
    } else {
        print('owner is registered as accruer with helixNFT\n')
    }

    // Initialize the SwapFee and it's variables.
    await initSwapFee(token0, token1)
}


/** 
 * @dev Confirm that the correct factory is set.
 */
async function initFactory(token0, token1) {
    print('initialize factory:')

    // make sure owner is the feeToSetter or factory setting calls will fail
    const feeToSetter = await factory.feeToSetter()
    if (owner.address != feeToSetter) {
        print(`CANCEL EXECUTION IF OWNER IS NOT FEE TO SETTER\nfeeToSetter: ${short(feeToSetter)}`)
    } else {
        print(`owner is factory feeToSetter: ${owner.address == feeToSetter}`)
    }

    // make sure the factory oracle is set
    if (await factory.oracle() != oracle.address) {
        print(`set factory oracle to ${short(oracle.address)}`)
        await factory.setOracle(oracle.address)
    }
    print(`factory oracle address is ${short(await factory.oracle())}`)

    // if oracle.factory != factory.address there will be a pair address mismatch during oracle update
    // we throw an error because oracle.factory is immutable and there's no reason to proceed
    const oracleFactory = await oracle.factory()
    if (factory.address != oracleFactory) {
        throw `Error: oracle.factory ${short(oracleFactory)} does not equal factory ${short(factory.address)}`
    } else {
        print(`oracle factory address is ${short(factory.address)}`)
    }

    // create the token pairs in factory that will be used by swap, those are 
    // (A, B) which are the input and output swap values
    // (B, AP) which is the output paid to the user in AP
    // (B, TT) which is the output paid to the user in HELIX (TT == Target Token)
    // Prepare the token pairs for swapping.
    print('prepare the factory token pairs:')
    print('\n')

    // caller will swap token0 for token1
    await prepareFactoryPair(token0, token1) 
    print('\n')

    // internal to swapFee, tokens 1 and 0 will swap with targetHPToken
    await prepareFactoryPair(token0, targetHPToken) 
    print('\n')

    await prepareFactoryPair(token1, targetHPToken) 
    print('\n')

    // internal to swapFee, tokens 1 and 0 will swap with targetToken
    await prepareFactoryPair(token0, targetToken)
    print('\n')

    //await prepareFactoryPair(token1, targetToken)
    //print('\n')
}

// NOTE - use token0 and token1 to clearly differentiate from tokenA and tokenB
async function prepareFactoryPair(token0, token1) {
    print(`prepare factory pair for tokens ${short(token0.address)} and ${short(token1.address)}:`)
    
    // the workflow for pairs in factory must be in the following order:
    // 1. get, or create if necessary, the pair address
    // 2. get an instance of the pair so that it's functions can be called
    // 3. enable the pair in the factory so that the pair can be updated with the oracle
    // 4. transfer funds of each token to the pair so that the pair has a positive balance of each token
    // 5. mint the pair to trigger an update so that the token balances are moved to the pair's reserves
    // 6. update the pair in the oracle so that an historical observation is made which allows oracle.consult to work

    // 1. if the pair isn't created then nothing else can happen with the pair in factory
    let pairAddress = await factory.getPair(token0.address, token1.address)
    if (pairAddress == addressZero) {
        print(`1. create pair`)
        pairAddress = await factory.createPair(token0.address, token1.address, { gasLimit })
        print(`create token pair (${short(token0.address)}, ${short(token1.address)}) with address ${pairAddress}`)
    } else {
        print(`1. pair address is: ${pairAddress}`)
    }

    // 2. get a pair instance so that pair functions can be called
    print(`2. load pair: ${pairAddress}`)
    const IPair = await ethers.getContractFactory('HelixPair')
    const pair = await IPair.attach(pairAddress).connect(owner)

    // 3. enable the pair with the oracle if it hasn't been already
    const isPairEnabled = await factory.oracleEnabled(pair.address)
    if (!isPairEnabled) {
        print(`3. enable pair ${short(pair.address)} with oracle`)
        await factory.enablePair(pair.address, { gasLimit })
        print(`pair ${short(pair.address)} has been enabled with oracle`)
    } else {
        print(`3. pair ${short(pair.address)} is enabled with oracle`)
    }
    
    // 4. transfer funds to the pair so that there is a positive balance to 
    //    be transferred into reserves by mint
    print(`4. transfer funds to pair ${short(pair.address)}`)
    const amount = '10000000000000000000000000000000000'
    await transferTokenToPair(token0, amount, pair)
    await transferTokenToPair(token1, amount, pair)

    // 5. mint to move funds from balances into reserves by implicitly calling update
    print('5. mint')
    const reservesThreshold = 1000     // only mint if the current reserves are below the threshold
    let [reserves0, reserves1, ] = await pair.getReserves()
    if (reserves0 < reservesThreshold || reserves1 < reservesThreshold) {
        const mintTo = owner.address
        print(`before mint, pair ${short(pair.address)} reserves are ${reserves0} and ${reserves1}`)
        print(`mint pair ${short(pair.address)} to ${short(mintTo)}`)
        await pair.mint(owner.address, { gasLimit })
    }
    [reserves0, reserves1, ] = await pair.getReserves()
    print(`pair ${short(pair.address)} reserves are ${reserves0} and ${reserves1}`)

    // 6. Now that the pair has positive reserves, we can update the pair in the oracle
    print(`6. factory update oracle with pair ${short(pair.address)}`)
    try {
        await oracle.update(token0.address, token1.address, { gasLimit })
    } catch(error) {
        print('updateOracle error')
    }
    
    /*
    print('show observations')
    // display the observations for each granularity index
    const localPairAddress = await swapFee.pairFor(token0.address, token1.address)
    const granularity = await oracle.granularity()
    for (let i = 0; i < granularity; i++) {
        let observation = await oracle.pairObservations(localPairAddress, i)
        print(`${i}`)
        print(`timestamp: ${observation.timestamp}`)
        print(`price0Cumulative: ${observation.price0Cumulative}`)
        print(`price1Cumulative: ${observation.price1Cumulative}`)
    }
    */
}

async function transferTokenToPair(token, amount, pair) {
    print(`transfer ${amount} of token ${short(token.address)} to pair ${short(pair.address)}`)
    await token.transfer(pair.address, amount, { gasLimit })
}


async function initSwapFee(token0, token1) {
    print('initialize swapFee:')

    // the workflow for the calls in this function are as follows
    // 1. make sure the swapFee factory address is correct
    // 2. make sure the swapFee oracle address is correct
    // 3. make sure that the swap fee refReg address matches the refReg address
    // 4. make sure the swapFee router address is set to owner.address
    // 5. set the contractRewardDistribution to give the user the full range of choices
    // 6. set the userRewardDistribution to 50, to give them 50% HELIX and 50% AP payout
    // 7. make sure all the tokens that'll be used are whitelisted
    // 8. make sure that the swapFee contract has the right helixToken set
    // 9. make sure that the swapFee contract has a positive balance of helixToken
    // 10. make sure all the tokens that'll be used are added to the swapFee contract 

    // the order of the calls in this function don't matter too much as long as 
    // setUserRewardDistribution is called after setDefaultRewardDistribution
    
    // 1. make sure that the swap fee factory address matches the script's factory address
    if (factory.address != await swapFee.factory()) {
        print(`1. set swapFee factory to ${short(factory.address)}`)
        await swapFee.setFactory(factory.address)
    } else {
        print('1. swap fee factory address matches factory address')
    }

    // 2. make sure that the swap fee oracle address matches the factory oracle address and the script's oracle address
    // note that since factory oracle address already equals the scipt oracle address we only need to check against one
    if (oracle.address != await swapFee.oracle()) {
        print(`2. set swapFee oracle to ${short(oracle.address)}`)
        await swapFee.setOracle(oracle.address)
    } else {
        print('2. swap fee oracle address matches oracle address')
    }

    // 3. make sure that the swap fee refReg address matches the refReg address
    if (refReg.address != await swapFee.refReg()) {
        print(`3. set swapFee refReg to ${short(refReg.address)}`)
        await swapFee.setRefReg(refReg.address)
    } else {
        print('3. swap fee refReg address matches refReg address')
    }

    // 4. Use the owner account for swapFee.router so that the owner can call the swap function
    if (router.address != await swapFee.router()) {
        print(`4. set swapFee router address to ${short(router.address)}`)
        await swapFee.setRouter(router.address)
    } else {
        print('4. swap fee router address matches owner address')
    }

    // 5. Set the contract default reward distribution
    // Give the user the full range of distributions to choose from
    const contractRewardDistribution = 100
    if (contractRewardDistribution != await swapFee.defaultRewardDistribution()) {
        print(`5. set contract reward distribution to ${contractRewardDistribution}`)
        await swapFee.setDefaultRewardDistribution(contractRewardDistribution)
    } else {
        print(`5. contract reward distribution is ${await swapFee.defaultRewardDistribution()}`)
    }

    // 5. set the user's default reward distribution
    // take a 50/50 split of HELIX and AP, i.e. userRewardDistribution == 50
    if (userRewardDistribution != await swapFee.rewardDistribution(owner.address)) {
        print(`6. set user reward distribution to ${userRewardDistribution}`)

        // Call the contract as the user so that msg.sender == owner.address
        // and correct rewardDistribution is assigned.
        await swapFee.setUserDefaultDistribution(userRewardDistribution)
    } else {
        print(`6. user reward distribution is ${await swapFee.rewardDistribution(owner.address)}`)
    }

    // 7. make sure that the input and output tokens are whitelisted
    print('7. whitelist tokens')
    await whitelistAdd(token0.address)
    await whitelistAdd(token1.address)
  
    // 8. make sure that the swapFee contract has the right helix token set
    print('8. check swap fee helix token matches helixTokenAddress')
    if (await swapFee.helixToken() != helixToken.address) {
        await swapFee.setHelixToken(helixToken.address)
    }

    // 9. make sure the swapFee contract has a positive HELIX balance
    const swapFeeHelixBalance = '10000000000000'
    const swapFeeHelixThreshold = '10000000000'
    print(`9. swapFee HELIX balance is ${await helixToken.balanceOf(swapFee.address)}`)
    if (await helixToken.balanceOf(swapFee.address) < swapFeeHelixThreshold) {
        print(`increase swapFee HELIX balance by ${swapFeeHelixBalance}`)
        await helixToken.transfer(swapFee.address, swapFeeHelixBalance, { gasLimit })
    }

    // 10. make sure that the token pairs have been added to swapFee contract
    // Note that we need to add 3 pairs,
    // the input output pair (0, 1)
    // pairs that internally swap for AP
    // and pairs that internally swap for HELIX
    print('10. add pairs')
    const percentReward = 10
    await addPair(token0.address, token1.address, percentReward)
    await addPair(token0.address, targetHPToken.address, percentReward)
    await addPair(token1.address, targetHPToken.address, percentReward)
    await addPair(token0.address, targetToken.address, percentReward)
    // await addPair(token1.address, targetToken.address, percentReward)

    print('\n')
}

// only pass token addresses and not token objects
async function whitelistAdd(token) {
    if (!(await swapFee.whitelistContains(token))) {
        print(`add token ${short(token)} to whitelist`)
        await swapFee.whitelistAdd(token, { gasLimit })
    } else {
        print(`whitelist contains token ${short(token)}`)
    }
}

// only pass token addresses and not token objects
async function addPair(token0, token1, percentReward) {
    if (token1 != token0 && !(await swapFee.pairExists(token0, token1))) {
        print(`add tokens ${short(token0)} and ${short(token1)} to swapFee`)
        const pair = await swapFee.pairFor(token0, token1)
        await swapFee.addPair(percentReward, pair, { gasLimit })
        print(`added pair ${short(await swapFee.pairFor(token0, token1))} to swapFee`)
    } else {
        print(`swap fee pair ${short(await swapFee.pairFor(token0, token1))} already exists`)
    }
}

// sanity check before calling swap
// use In/Out instead of 0/1 for token names to retain swapFee.getQuantityOut parameter convention
async function getQuantityOut(tokenIn, quantityIn, tokenOut) {
    print('check get quantity out')
    let quantityOut = -1
    try {
        // Try to avoid MISSING HISTORICAL OBSERVATION error
        await oracle.update(tokenIn.address, tokenOut.address, { gasLimit })
        quantityOut = await swapFee.getQuantityOut(tokenIn.address, quantityIn, tokenOut.address)
    } catch(error) {
        console.error(error)
    }

    print(`get ${quantityOut} out in ${short(tokenOut.address)} for ${quantityIn} of ${short(tokenIn.address)}`)
}

async function swap(account, input, output, amount) {
    print(`swap ${amount} of token ${short(input)} for token ${short(output)} and credit account ${short(account)}.`)

    const prevBalance = await swapFee.getBalance(account)
    const prevAP = await helixNFT.getAccumulatedHP(account)
    const prevAccruedAP = (await swapFee.totalAccruedAP()).toNumber()

    try {
        await swapFee.swap(account, input, output, amount, { gasLimit })
        
        // Check the change in balance
        print(`account ${short(account)} previous balance: ${prevBalance}`)
        const balance = await swapFee.getBalance(account) 
        print(`account ${short(account)} new balance: ${balance}`)

        // Check the change in AP
        print(`account ${short(account)} previous AP: ${prevAP}`)
        const ap = await helixNFT.getAccumulatedHP(account)
        print(`account ${short(account)} new balance: ${ap}`)

        // Check the change in total AP
        let accruedAP = await swapFee.totalAccruedAP()
        print(`total accrued AP was: ${prevAccruedAP}`)
        print(`total accrued AP is now: ${accruedAP}`)

    } catch(error) {
        console.error(error)
    }
}

async function withdraw() {
    let prevBalance = await swapFee.getBalance(owner.address)
    let prevTotalMined = await swapFee.totalMined()
    
    try {
        // Call withdraw()
        await swapFee.withdraw()

        // Check the change in balance
        print(`Account ${short(owner.address)} previous balance: ${prevBalance}`)
        const balance = await swapFee.getBalance(owner.address) 
        print(`Account ${short(owner.address)} new balance: ${balance}`)

        // Check the change in total mined
        print(`Previous total mined was: ${prevTotalMined}`)
        const totalMined = await swapFee.totalMined()
        print(`Total mined is: ${totalMined}`)
    } catch(error) {
        console.error(error)
    }
}

// Shorten the given string to the first and last n characters.
function short(str, n=4) {
    const first = str.slice(2, n+2)
    const last = str.slice(str.length-n, str.length)
    const newStr = `${first}...${last}`
    return newStr
}

// Print the given string `str`
function print(str) {
    if (verbose) {
        console.log(str)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
