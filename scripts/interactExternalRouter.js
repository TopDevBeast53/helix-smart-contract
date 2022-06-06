/**
 * @dev Interaction script for deployed external router contract.
 * 
 * Run from project root using: 
 *      npx hardhat run scripts/interactExternalRouter.js --network rinkeby
 */

require ('dotenv').config()

const verbose = true
const maxInt = ethers.constants.MaxUint256

const env = require('./constants/env')
const addresses = require('./constants/addresses')
const contracts = require('./constants/contracts')
const externalContracts = require('./constants/externalContracts')

const routerAddress = externalContracts.router[env.network]
const usdcAddress = externalContracts.usdcToken[env.network]
const migratorAddress = contracts.helixMigrator[env.network]
const helixAddress = contracts.helixToken[env.network]
const pairAddress = '0x161962Aec8f3c61D865cd5d53A334780763364e6'

const overrides = {
    gasLimit: 6721975
}

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    // Load the contracts that will be used.
    const erc20 = "contracts/libraries/ERC20.sol:ERC20"
    const helixToken = await getContract(erc20, helixAddress, deployer)
    const usdcToken = await getContract(erc20, usdcAddress, deployer)
    const externalRouter = await getContract("HelixRouterV1", routerAddress, deployer)
    const pair = await getContract(erc20, pairAddress, deployer)

    // Approve the tokens to be transferred by the router
    //await approve(deployer, helixToken, externalRouter.address)
    //await approve(deployer, usdcToken, externalRouter.address)
    await approve(deployer, pair, migratorAddress)

    // Add liquidity to the externalRouter
    /*
    console.log('add liquidity')
    await externalRouter.addLiquidity(
        helixToken.address, 
        usdcToken.address, 
        '300000000000000000000',    // 300
        '300000000000000000000',    // 300
        0, 
        0, 
        deployer.address, 
        maxInt, 
        overrides
    )
    */

    console.log('done')
}

// Return the contract with name and address
async function getContract(name, address, wallet) {
    console.log(`get ${name} from ${short(address)}`)
    const ContractFactory = await ethers.getContractFactory(name)
    return await ContractFactory.attach(address).connect(wallet)
}

// Approve the address to spend amount of token
async function approve(deployer, token, address, amount=maxInt) {
    console.log(`approve ${short(address)} on ${short(token.address)}`)
    const allowance = await token.allowance(deployer.address, address)
    if (!allowance.eq(amount)) {
        await token.approve(address, amount)
    }
}

// Shorten the given string to the first and last n characters.
function short(str, n=4) {
    const first = str.slice(2, n+2)
    const last = str.slice(str.length-n, str.length)
    const newStr = `${first}...${last}`
    return newStr
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
