/* 
 * @dev Interaction script for deployed LP Swap contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactLpSwap.js --network testnetBSC
 */

const verbose = true

require ('dotenv').config()
const contracts = require('./constants/contracts')
const env = require('./constants/env')

const lpSwapAddress = contracts.lpSwap[env.network]
// const lpSwapAddress= '0x3b6B922CB2D771F06e3175e7121628ceB5b7520b'
const lpToken0Address = '0xc83Ff69F60403cbAC67A9149D557A6dC4fD0509D'
const lpToken1Address = '0xd61d7203eE81C01fb7bE99931C1381318A3D2Faf'
const lpToken2Address = '0x7cd7dEa8AB3b8B4Dc35C761BA18E2E6df85484bA'

const gasLimit = 9999999
const addressZero = '0x0000000000000000000000000000000000000000'

const maxInt = ethers.constants.MaxUint256;

let lpSwap
let lpToken0, lpToken1, lpToken2
let owner, user0, user1, user2

async function main() {
    print('Interact Lp Swap\n')
    
    await initScript() 
    await loadContracts()

    // print the open swap data
    await printAllSwaps(await getSwapIds())

    // print the bid data
    await printAllBids(await getAllBidIds())

    // Approve lpSwap to spend user funds
    // ONLY need to call with new lpSwap and token deployments
    // await approve(owner, lpToken0, lpSwap, maxInt)

    // Open a swap with amount of helixLp and ask for helixToken
    const swapOpener = user0
    const toBuyerToken = lpToken0
    const toSellerToken = lpToken2
    const amount = expandTo18Decimals('1000')
    const ask = expandTo18Decimals('100')
    // await openSwap(swapOpener, toBuyerToken, toSellerToken, amount, ask)

    // Make a new bid on swap with swapId
    const bidder = user2

    const makeBidSwapId0 = 1
    const bidAmount0 = expandTo18Decimals('23000')
    // await makeBid(bidder, makeBidSwapId0, bidAmount0)

    const makeBidSwapId1 = 3
    const bidAmount1 = expandTo18Decimals('36000')
    // await makeBid(bidder, makeBidSwapId1, bidAmount1)

    // Accept the bid id and close the swap
    const seller = user1
    const acceptBidId = 7
    // await acceptBid(seller, acceptBidId)

    // Accept the ask and close the swap
    const buyer = user1
    const acceptAskSwapId = 2
    // await acceptAsk(buyer, acceptAskSwapId)

    const setBidBidder = owner
    const setBidId = 2
    const setBidAmount = expandTo18Decimals(97)
    // await setBid(setBidBidder, setBidId, setBidAmount)

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
    const ILpSwap = await ethers.getContractFactory('LpSwap')
    const ILpToken = await ethers.getContractFactory('ERC20LP')

    print(`LP Swap:\t\t${lpSwapAddress}`)
    lpSwap = await ILpSwap.attach(lpSwapAddress)

    print(`LP Token 0:\t\t${lpToken0Address}`)
    lpToken0 = await ILpToken.attach(lpToken0Address)

    print(`LP Token 1:\t\t${lpToken1Address}`)
    lpToken1 = await ILpToken.attach(lpToken1Address)

    print(`LP Token 2:\t\t${lpToken2Address}`)
    lpToken2 = await ILpToken.attach(lpToken2Address)

    print('\n')
}

// Called to approve `contract` to spend `amount` of `token` from `wallet`
async function approve(wallet, token, contract, amount) {
    print(`approve contract for amount of token`)
    const _token = await token.connect(wallet)
    await _token.approve(contract.address, amount)
}

async function openSwap(wallet, toBuyerToken, toSellerToken, amount, ask) {
    print(`open a new swap`)
    const _lpSwap = await lpSwap.connect(wallet)
    await _lpSwap.openSwap(toBuyerToken.address, toSellerToken.address, amount, ask)
}

async function getSwapIds() {
    print(`get swap IDs`)
    const _lpSwap = await lpSwap.connect(owner)
    const swapIdsLength = await _lpSwap.getSwapId()
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
    const swap = await lpSwap.getSwap(swapId)
    print(`print swap`)
    print(`swapId:\t\t\t${swapId}`)
    print(`toBuyerToken:\t\t${swap.toBuyerToken}`)
    print(`toSellerToken:\t\t${swap.toSellerToken}`)
    print(`bidIds:\t\t\t${swap.bidIds}`)
    print(`seller:\t\t\t${swap.seller}`)
    print(`buyer:\t\t\t${swap.buyer}`)
    print(`amount:\t\t\t${reduceBy18Decimals(swap.amount)}`)
    print(`cost:\t\t\t${reduceBy18Decimals(swap.cost)}`)
    print(`ask:\t\t\t${reduceBy18Decimals(swap.ask)}`)
    print(`isOpen:\t\t\t${swap.isOpen}`)
    print(`\n`)
}

// make a bid of `amount` on `swapId` as `wallet`
async function makeBid(wallet, swapId, amount) {
    print(`make bid`)
    const _lpSwap = await lpSwap.connect(wallet)
    await _lpSwap.makeBid(swapId, amount)
}

async function getAllBidIds() {
    print(`get all Bid Ids`)
    const _lpSwap = await lpSwap.connect(owner)
    const bidIdsLength = await _lpSwap.getBidId()
    let bidIds = []
    for (let i = 0; i <= bidIdsLength; i++) {
        bidIds.push(i)
    }
    print(`\n`)
    return bidIds
}

async function getBidIds(swapId) {
    print(`get bid ids on swap id ${swapId}`)
    const _lpSwap = await lpSwap.connect(owner)
    const swap = await _lpSwap.getSwap(swapId)
   
    let bidIds = []
    for (let i in swap.bidIds) {
        const bid = await lpSwap.getBid(i)
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
    const bid = await lpSwap.getBid(bidId)
    print(`print bid`)
    print(`bidId:\t\t\t${bidId}`)   
    print(`bidder:\t\t\t${bid.bidder}`)   
    print(`swapId:\t\t\t${bid.swapId}`)   
    print(`amount:\t\t\t${reduceBy18Decimals(bid.amount)}`)   
    print(`\n`)
}

async function acceptBid(seller, bidId) {
    print(`accept bid ${bidId}`)
    const _lpSwap = await lpSwap.connect(seller)
    await _lpSwap.acceptBid(bidId)
}

async function acceptAsk(buyer, swapId) {
    print(`accept ask ${swapId}`)
    const _lpSwap = await lpSwap.connect(buyer)
    await _lpSwap.acceptAsk(swapId)
}

async function setBid(bidder, bidId, amount) {
    print(`set bid`)
    const _lpSwap = await lpSwap.connect(bidder)
    await _lpSwap.setBid(bidId, amount)
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
