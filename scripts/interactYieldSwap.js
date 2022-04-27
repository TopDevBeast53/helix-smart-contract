/* 
 * @dev Interaction script for deployed Yield Swap contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactYieldSwap.js --network testnetBSC
 */

const verbose = true

require ('dotenv').config()
const contracts = require('./constants/contracts')
const env = require('./constants/env')

/*
const helixTokenAddress = contracts.helixToken[env.network]
const chefAddress = contracts.masterChef[env.network]
const helixLPAddress = contracts.hpToken[env.network]
*/

const helixTokenAddress = '0x124c90bF3777F0570845Fbdd67e337BC0D5A0e68'
const chefAddress = '0xff90E6f0CE1579330deB52446De66fd7a4642DeD'
const helixLPAddress = '0xE5DDA1F151Deb8DFD527F9F304cF2a16bB6adceE'
// const yieldSwapAddress = '0xb953F3096371364acB88B34eD89E269DA625a96A'
const yieldSwapAddress = contracts.yieldSwap[env.network]

const gasLimit = 9999999
const overrides = {
    gasLimit: 9999999
}
const addressZero = '0x0000000000000000000000000000000000000000'

const maxInt = ethers.constants.MaxUint256;

let helixToken
let chef
let helixLP
let yieldSwap
let owner, user0, user1, user2

async function main() {
    print('Interact Yield Swap\n')
    
    await initScript() 
    await loadContracts()

    // print the open swap data
    // await printAllSwaps(await getSwapIds())
   
    // print the bid data
    await printAllBids(await getAllBidIds())

    // Add the HelixLp to chef staking pool
    // ONLY call with new chef and helixLP deployments
    // await addLpToken()
    
    // Approve yieldSwap to spend user funds
    // ONLY need to call with new yieldSwap and token deployments
    // await approve(user0, helixToken, yieldSwap, maxInt)
    // await approve(user0, helixLP, yieldSwap, maxInt)

    // Open a swap with amount of helixLp and ask for helixToken
    const swapOpener = user0
    const amount = expandTo18Decimals('11000')
    const ask = expandTo18Decimals('4000')
    const duration = 400
    // await openSwap(swapOpener, amount, ask, duration)

    // Make a new bid on swap with swapId
    const bidder = owner
    const makeBidSwapId0 = 9
    const bidAmount0 = expandTo18Decimals('3950')
    // await makeBid(bidder, makeBidSwapId0, bidAmount0)

    // Accept the bid id and close the swap
    const seller = user2
    const acceptBidId = 16
    // await acceptBid(seller, acceptBidId)

    // Accept the ask and close the swap
    const buyer = user1
    const acceptAskSwapId = 8
    // await acceptAsk(buyer, acceptAskSwapId)

    // Withdraw purchased yield 
    const caller = user1
    const withdrawSwapId0 = 4
    // await withdraw(caller, withdrawSwapId0)

    print('done')
}

// Initialize this script's provider and wallet
async function initScript() {
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545'
    const provider = new ethers.providers.getDefaultProvider(rpc)

    owner = new ethers.Wallet(process.env.YS_OWNER_KEY, provider)
    print(`owner:\t\t\t${owner.address}`)

    user0 = new ethers.Wallet(process.env.YS_USER0_KEY, provider)
    print(`user0:\t\t\t${user0.address}`)

    user1 = new ethers.Wallet(process.env.YS_USER1_KEY, provider)
    print(`user1:\t\t\t${user1.address}`)

    user2 = new ethers.Wallet(process.env.YS_USER2_KEY, provider)
    print(`user2:\t\t\t${user2.address}`)

    print('\n')
}

async function loadContracts() {
    const IHelixToken = await ethers.getContractFactory('HelixToken')
    const IChef = await ethers.getContractFactory('MasterChef')
    const IHelixLP = await ethers.getContractFactory('ERC20LP')
    const IYieldSwap = await ethers.getContractFactory('YieldSwap')

    print(`Helix Token:\t\t${helixTokenAddress}`)
    helixToken = await IHelixToken.attach(helixTokenAddress)

    print(`Chef:\t\t\t${chefAddress}`)
    chef = await IChef.attach(chefAddress)

    print(`Helix LP:\t\t${helixLPAddress}`)
    helixLP = await IHelixLP.attach(helixLPAddress)

    print(`Yield Swap:\t\t${yieldSwapAddress}`)
    yieldSwap = await IYieldSwap.attach(yieldSwapAddress)

    print('\n')
}

// Only call after new chef and helix LP deployment
async function addLpToken() {
    print('add LP Token to Chef')
    const allocPoint = expandTo18Decimals('1000')
    const lpToken = helixLP.address
    const withUpdate = true
    const _chef = chef.connect(owner)
    const tx = await _chef.add(allocPoint, lpToken, withUpdate)
    print(tx)
}

// Called to approve `contract` to spend `amount` of `token` from `wallet`
async function approve(wallet, token, contract, amount) {
    print(`approve contract for amount of token`)
    const _token = await token.connect(wallet)
    await _token.approve(contract.address, amount)
}

async function openSwap(wallet, amount, ask, lockDuration) {
    print(`open a new swap`)
    const poolId = 1;
    const _yieldSwap = await yieldSwap.connect(wallet)
    await _yieldSwap.openSwap(helixToken.address, poolId, amount, ask, lockDuration)
}

async function getSwapIds() {
    print(`get swap IDs`)
    const _yieldSwap = await yieldSwap.connect(owner)
    const swapIdsLength = await _yieldSwap.getSwapId()
    let swapIds = []
    for (let i = 0; i <= swapIdsLength; i++) {
        swapIds.push(i)
    }
    print(`\n`)
    return swapIds
}

async function printAllSwaps(swapIds) {
    for (let i in swapIds) {
        await printSwap(i)
    }
}

async function printSwap(swapId) {
    const swap = await yieldSwap.getSwap(swapId)
    print(`print swap`)
    print(`swapId:\t\t\t${swapId}`)
    print(`lpToken:\t\t${swap.lpToken}`)
    print(`exToken:\t\t${swap.exToken}`)
    print(`bidIds:\t\t\t${swap.bidIds}`)
    print(`seller:\t\t\t${swap.seller}`)
    print(`buyer:\t\t\t${swap.buyer}`)
    print(`poolId:\t\t\t${swap.poolId}`)
    print(`amount:\t\t\t${reduceBy18Decimals(swap.amount)}`)
    print(`ask:\t\t\t${reduceBy18Decimals(swap.ask)}`)
    print(`lockUntilTimestamp:\t${swap.lockUntilTimestamp}`)
    print(`isOpen:\t\t\t${swap.isOpen}`)
    print(`isWithdrawn:\t\t${swap.isWithdrawn}`)
    print(`\n`)
}

// make a bid of `amount` on `swapId` as `wallet`
async function makeBid(wallet, swapId, amount) {
    print(`make bid`)
    const _yieldSwap = await yieldSwap.connect(wallet)
    await _yieldSwap.makeBid(swapId, amount)
}

async function getAllBidIds() {
    print(`get all Bid Ids`)
    const _yieldSwap = await yieldSwap.connect(owner)
    const bidIdsLength = await _yieldSwap.getBidId()
    let bidIds = []
    for (let i = 0; i <= bidIdsLength; i++) {
        bidIds.push(i)
    }
    print(`\n`)
    return bidIds
}

async function getBidIds(swapId) {
    print(`get bid ids on swap id ${swapId}`)
    const _yieldSwap = await yieldSwap.connect(owner)
    const swap = await _yieldSwap.getSwap(swapId)
   
    let bidIds = []
    for (let i in swap.bidIds) {
        const bid = await yieldSwap.getBid(i)
        bidIds.push(i) 
    }
    print(`\n`)
    return bidIds
}

async function printAllBids(bidIds) {
    for (let i in bidIds) {
        await printBid(i)    
    }
}

async function printBid(bidId) {
    const bid = await yieldSwap.getBid(bidId)
    print(`print bid`)
    print(`bidId:\t\t\t${bidId}`)   
    print(`bidder:\t\t\t${bid.bidder}`)   
    print(`swapId:\t\t\t${bid.swapId}`)   
    print(`amount:\t\t\t${reduceBy18Decimals(bid.amount)}`)   
    print(`\n`)
}

async function acceptBid(seller, bidId) {
    print(`accept bid ${bidId}`)
    const _yieldSwap = await yieldSwap.connect(seller)
    await _yieldSwap.acceptBid(bidId)
}

async function acceptAsk(buyer, swapId) {
    print(`accept ask ${swapId}`)
    const _yieldSwap = await yieldSwap.connect(buyer)
    await _yieldSwap.acceptAsk(swapId)
}

async function withdraw(caller, swapId) {
    print(`withdraw yield ${swapId}`)
    const _yieldSwap = await yieldSwap.connect(caller)
    await _yieldSwap.withdraw(swapId)
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

function expandTo18Decimals(val) {
    return val + '000000000000000000'
}

function reduceBy18Decimals(val) {
    return val / 1000000000000000000
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
