/* 
 * @dev Interaction script for deployed VIP Presale contract.
 * 
 * Run from project root using:
 *     npx hardhat run scripts/interactVipPresale.js --network testnetBSC
 */

const verbose = true

require ('dotenv').config()
const contracts = require('./constants/contracts')
const env = require('./constants/env')

const vipPresaleAddress = contracts.vipPresale[env.network]
const tokenAAddress = '0xa34365267e9795FC1fe34b31cB0b0112d5667e8F'
const tokenBAddress = '0xeB101767DFF4dbb08001459C8098E73C67C4A4e1'

const gasLimit = 9999999
const addressZero = '0x0000000000000000000000000000000000000000'

const maxInt = ethers.constants.MaxUint256;

let vipPresale
let wallet0, wallet1, wallet2, wallet3
let tokenA
let tokenB

async function main() {
    print('INTERACT VIP PRESALE\n')
    
    await initScript() 
    await loadContracts()

    const tokens = [tokenA, tokenB]
    const wallets = [wallet0, wallet1, wallet2, wallet3]
    const amounts = [maxInt, maxInt, maxInt, maxInt]
    await approve(vipPresale, tokens, wallets, amounts)
    
    print('done')
}

// Initialize this script's provider and wallet
async function initScript() {
    const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545'
    const provider = new ethers.providers.getDefaultProvider(rpc)

    wallet0 = new ethers.Wallet(process.env.PRIVATE_KEY_0, provider)
    print(`wallet0:\t\t${wallet0.address}`)

    wallet1 = new ethers.Wallet(process.env.PRIVATE_KEY_1, provider)
    print(`wallet1:\t\t${wallet1.address}`)

    wallet2 = new ethers.Wallet(process.env.PRIVATE_KEY_2, provider)
    print(`wallet2:\t\t${wallet2.address}`)

    wallet3 = new ethers.Wallet(process.env.PRIVATE_KEY_3, provider)
    print(`wallet3:\t\t${wallet3.address}`)

    print('\n')
}

async function loadContracts() {
    const IVipPresale = await ethers.getContractFactory('VipPresale')
    const ITestToken = await ethers.getContractFactory('TestToken')

    print(`VIP Presale:\t\t${vipPresaleAddress}`)
    vipPresale = await IVipPresale.attach(vipPresaleAddress)

    print(`Token A (BUSD):\t\t${tokenAAddress}`)
    tokenA = await ITestToken.attach(tokenAAddress)

    print(`Token B (HELIX):\t${tokenBAddress}`)
    tokenB = await ITestToken.attach(tokenBAddress)

    print('\n')
}

// Approve the contract to spend amount of each token from each wallet
async function approve(contract, tokens, wallets, amounts) {
    for (let i = 0; i < tokens.length; i++) {
        for (let j = 0; j < wallets.length; j++) {
            print(`i=${i} j=${j}`)
            token = tokens[i].connect(wallets[j])
            await token.approve(contract.address, amounts[j])
        }
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
